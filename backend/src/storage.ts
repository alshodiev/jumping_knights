import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Request, Response, Express } from "express";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "./config.js";
import { secret } from "./auth.js";

export interface UploadTarget { url: string; method: "PUT"; headers: Record<string, string> }

/** Where the video files and the small records file live. */
export interface Storage {
  kind: "r2" | "local";
  uploadTarget(key: string, contentType: string): Promise<UploadTarget>;
  readUrl(key: string, ttlSeconds: number): Promise<string>;
  stat(key: string): Promise<{ size: number } | null>;
  remove(key: string): Promise<void>;
  getText(key: string): Promise<string | null>;
  putText(key: string, text: string): Promise<void>;
}

const r2Ready = () => Object.values(config.r2).every(Boolean);

// ---------------- Cloudflare R2 (S3-compatible) ----------------

function r2Storage(): Storage {
  const bucket = config.r2.bucket;
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: config.r2.accessKeyId, secretAccessKey: config.r2.secretAccessKey },
  });
  const missing = (e: any) => e?.name === "NotFound" || e?.name === "NoSuchKey" || e?.$metadata?.httpStatusCode === 404;
  return {
    kind: "r2",
    async uploadTarget(key, contentType) {
      const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn: 3600 });
      return { url, method: "PUT", headers: { "Content-Type": contentType } };
    },
    readUrl: (key, ttl) =>
      getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentType: "video/mp4", ResponseContentDisposition: "inline" }),
        { expiresIn: ttl },
      ),
    async stat(key) {
      try {
        const r = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        return { size: Number(r.ContentLength ?? 0) };
      } catch (e) {
        if (missing(e)) return null;
        throw e;
      }
    },
    async remove(key) {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
    async getText(key) {
      try {
        const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        return (await r.Body?.transformToString()) ?? null;
      } catch (e) {
        if (missing(e)) return null;
        throw e;
      }
    },
    async putText(key, text) {
      await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: text, ContentType: "application/json" }));
    },
  };
}

// ---------------- Local folder (development and tests only) ----------------

const KEY_OK = /^[A-Za-z0-9][A-Za-z0-9/_.-]*$/;
const safeKey = (key: string) => KEY_OK.test(key) && !key.includes("..") && !key.includes("//");

function localStorageDriver(): Storage {
  const root = path.resolve(config.dataDir, "storage");
  const file = (key: string) => {
    if (!safeKey(key)) throw new Error("bad key");
    return path.join(root, key);
  };
  const link = (method: "GET" | "PUT", key: string, ttl: number) => {
    const exp = Date.now() + ttl * 1000;
    const sig = crypto.createHmac("sha256", secret()).update(`${method}:${key}:${exp}`).digest("base64url");
    return `${config.publicApiUrl}/api/_local-storage/${key}?exp=${exp}&sig=${sig}`;
  };
  return {
    kind: "local",
    async uploadTarget(key, contentType) {
      return { url: link("PUT", key, 3600), method: "PUT", headers: { "Content-Type": contentType } };
    },
    async readUrl(key, ttl) { return link("GET", key, ttl); },
    async stat(key) {
      try { return { size: fs.statSync(file(key)).size }; } catch { return null; }
    },
    async remove(key) { fs.rmSync(file(key), { force: true }); },
    async getText(key) {
      try { return fs.readFileSync(file(key), "utf8"); } catch { return null; }
    },
    async putText(key, text) {
      const f = file(key);
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, text);
    },
  };
}

/** Handlers that make the local driver's links work (same checks a real cloud link would do). */
export function mountLocalStorage(app: Express) {
  const root = path.resolve(config.dataDir, "storage");
  const check = (req: Request, method: "GET" | "PUT") => {
    const key = String(req.params[0] ?? "");
    const exp = Number(req.query.exp);
    const sig = String(req.query.sig ?? "");
    if (!safeKey(key) || !(exp > Date.now())) return null;
    const want = crypto.createHmac("sha256", secret()).update(`${method}:${key}:${exp}`).digest("base64url");
    const a = Buffer.from(sig), b = Buffer.from(want);
    return a.length === b.length && crypto.timingSafeEqual(a, b) ? key : null;
  };
  app.put("/api/_local-storage/*", (req: Request, res: Response) => {
    const key = check(req, "PUT");
    if (!key) return void res.status(403).end();
    const f = path.join(root, key);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    const out = fs.createWriteStream(f);
    let size = 0, aborted = false;
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > config.maxVideoBytes && !aborted) { aborted = true; out.destroy(); fs.rmSync(f, { force: true }); res.status(413).end(); req.destroy(); }
    });
    req.pipe(out);
    out.on("finish", () => { if (!aborted) res.status(200).end(); });
    out.on("error", () => { if (!res.headersSent) res.status(500).end(); });
  });
  app.get("/api/_local-storage/*", (req: Request, res: Response) => {
    const key = check(req, "GET");
    if (!key) return void res.status(403).end();
    const f = path.join(root, key);
    if (!fs.existsSync(f)) return void res.status(404).end();
    res.setHeader("Content-Type", "video/mp4");
    res.sendFile(f); // supports Range requests, so seeking works
  });
}

// ---------------- pick one ----------------

let cached: Storage | null | undefined;
/** R2 when configured. Local folder only outside production. Otherwise videos are switched off. */
export function getStorage(): Storage | null {
  if (cached !== undefined) return cached;
  if (r2Ready()) cached = r2Storage();
  else if (!config.isProd) cached = localStorageDriver();
  else cached = null;
  return cached;
}
