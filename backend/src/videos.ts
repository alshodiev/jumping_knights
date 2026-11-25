import crypto from "node:crypto";
import { Router, type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { config } from "./config.js";
import {
  endCoachSession, fakeVerify, hashPassword, isCoach, requireCoach, startCoachSession, verifyPassword,
} from "./auth.js";
import { getStorage, type Storage } from "./storage.js";

// ---------------------------------------------------------------------------
// Records: one small JSON file kept next to the videos (so it survives Render restarts).
// ---------------------------------------------------------------------------

interface VideoRec {
  id: string;
  note: string;          // private, only the coach sees it
  createdAt: number;
  size: number;
  key: string;
  status: "uploading" | "ready";
  pw: string;            // scrypt hash of this video's password (never leaves the server)
}
interface Db { videos: VideoRec[] }

const DB_KEY = "jk/videos.json";
let db: Db | null = null;
let chain: Promise<unknown> = Promise.resolve();

async function load(st: Storage): Promise<Db> {
  if (db) return db;
  const text = await st.getText(DB_KEY);
  db = text ? (JSON.parse(text) as Db) : { videos: [] };
  return db;
}

/** One change at a time; the file is saved before the change counts. */
function mutate<T>(st: Storage, fn: (d: Db) => T): Promise<T> {
  const run = chain.then(async () => {
    const draft = structuredClone(await load(st));
    const result = fn(draft);
    await st.putText(DB_KEY, JSON.stringify(draft));
    db = draft;
    return result;
  });
  chain = run.catch(() => undefined);
  return run;
}

/** For tests: forget the in-memory copy. */
export function resetVideoCache() { db = null; }

const newId = () => crypto.randomBytes(9).toString("base64url");
const keyFor = (id: string) => `videos/${id}.mp4`;

// ---------------------------------------------------------------------------
// Guessing protection for video passwords (in memory; resets on restart)
// ---------------------------------------------------------------------------

interface Bucket { count: number; resetAt: number }
const perIpVideo = new Map<string, Bucket>();
const perVideo = new Map<string, Bucket>();
const IP_MAX = 5, IP_WINDOW = 10 * 60_000;
const VIDEO_MAX = 12, VIDEO_WINDOW = 15 * 60_000;

function blocked(map: Map<string, Bucket>, key: string, max: number): boolean {
  const b = map.get(key);
  if (!b) return false;
  if (b.resetAt <= Date.now()) { map.delete(key); return false; }
  return b.count >= max;
}
function addFail(map: Map<string, Bucket>, key: string, window: number) {
  const now = Date.now();
  const b = map.get(key);
  if (!b || b.resetAt <= now) map.set(key, { count: 1, resetAt: now + window });
  else b.count += 1;
}
setInterval(() => {
  const now = Date.now();
  for (const m of [perIpVideo, perVideo]) {
    for (const [k, b] of m) if (b.resetAt <= now) m.delete(k);
    if (m.size > 20000) m.clear(); // safety valve against memory growth
  }
}, 5 * 60_000).unref();

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const wrap = (fn: (req: Request, res: Response) => Promise<unknown> | unknown) =>
  (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res)).catch(next);

const idOf = (req: Request) => String(req.params.id);
const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(100);

const loginLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 8, skipSuccessfulRequests: true, standardHeaders: true, legacyHeaders: false, message: { error: "Too many sign-in attempts. Try again later." } });
const unlockLimiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: "Too many tries. Please wait a minute." } });
const publicLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false });

let globalLoginFails: Bucket = { count: 0, resetAt: 0 };

export function videoRouter(): Router {
  const r = Router();

  // Nothing here should ever be cached by a browser or CDN (it can contain watch links)
  r.use((_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });

  const storageOr503 = (res: Response): Storage | null => {
    const st = getStorage();
    if (!st) res.status(503).json({ error: "Videos are not set up yet." });
    return st;
  };

  // ---- coach sign-in ----
  r.post("/coach/login", loginLimiter, wrap(async (req, res) => {
    if (!config.coachPasswordHash) return void res.status(503).json({ error: "Coach sign-in is not set up yet." });
    const body = z.object({ username: z.string().max(100), password: z.string().max(200) }).safeParse(req.body);
    if (!body.success) return void res.status(400).json({ error: "Enter your username and password." });
    const now = Date.now();
    if (globalLoginFails.resetAt > now && globalLoginFails.count >= 40) return void res.status(429).json({ error: "Too many sign-in attempts. Try again later." });
    // Always run the full password check so a wrong username takes as long as a wrong password
    const passOk = await verifyPassword(body.data.password, config.coachPasswordHash);
    const userOk = body.data.username.trim().toLowerCase() === config.coachUsername.toLowerCase();
    if (!passOk || !userOk) {
      if (globalLoginFails.resetAt <= now) globalLoginFails = { count: 0, resetAt: now + 3600_000 };
      globalLoginFails.count += 1;
      return void res.status(401).json({ error: "Wrong username or password." });
    }
    startCoachSession(res);
    res.json({ ok: true });
  }));

  r.post("/coach/logout", (_req, res) => { endCoachSession(res); res.json({ ok: true }); });
  r.get("/coach/me", (req, res) => { res.json({ signedIn: isCoach(req), configured: Boolean(config.coachPasswordHash) }); });

  // ---- coach: manage videos ----
  r.get("/coach/videos", requireCoach, wrap(async (_req, res) => {
    const st = storageOr503(res); if (!st) return;
    const d = await load(st);
    res.json({
      videos: [...d.videos].sort((a, b) => b.createdAt - a.createdAt)
        .map(({ id, note, createdAt, size, status }) => ({ id, note, createdAt, size, status })),
    });
  }));

  r.post("/coach/videos", requireCoach, wrap(async (req, res) => {
    const st = storageOr503(res); if (!st) return;
    const body = z.object({
      note: z.string().trim().max(200).default(""),
      password: passwordSchema,
      size: z.number().int().positive(),
      contentType: z.literal("video/mp4"),
    }).safeParse(req.body);
    if (!body.success) return void res.status(400).json({ error: body.error.issues[0]?.message ?? "Invalid upload." });
    if (body.data.size > config.maxVideoBytes) return void res.status(413).json({ error: `That file is too large (limit ${Math.round(config.maxVideoBytes / 1048576)} MB).` });
    const id = newId();
    const pw = await hashPassword(body.data.password);
    await mutate(st, (d) => { d.videos.push({ id, note: body.data.note, createdAt: Date.now(), size: body.data.size, key: keyFor(id), status: "uploading", pw }); });
    const upload = await st.uploadTarget(keyFor(id), "video/mp4");
    res.json({ id, upload });
  }));

  r.post("/coach/videos/:id/complete", requireCoach, wrap(async (req, res) => {
    const st = storageOr503(res); if (!st) return;
    const rec = (await load(st)).videos.find((v) => v.id === idOf(req));
    if (!rec) return void res.status(404).json({ error: "No such video." });
    const info = await st.stat(rec.key);
    if (!info) return void res.status(409).json({ error: "The upload didn't arrive. Please try again." });
    if (info.size > config.maxVideoBytes) {
      await st.remove(rec.key);
      await mutate(st, (d) => { d.videos = d.videos.filter((v) => v.id !== rec.id); });
      return void res.status(413).json({ error: "That file is too large." });
    }
    await mutate(st, (d) => { const v = d.videos.find((x) => x.id === rec.id); if (v) { v.status = "ready"; v.size = info.size; } });
    res.json({ ok: true });
  }));

  r.patch("/coach/videos/:id", requireCoach, wrap(async (req, res) => {
    const st = storageOr503(res); if (!st) return;
    const body = z.object({ note: z.string().trim().max(200).optional(), password: passwordSchema.optional() })
      .refine((b) => b.note !== undefined || b.password !== undefined, "Nothing to change.").safeParse(req.body);
    if (!body.success) return void res.status(400).json({ error: body.error.issues[0]?.message ?? "Invalid change." });
    if (!(await load(st)).videos.some((v) => v.id === idOf(req))) return void res.status(404).json({ error: "No such video." });
    const pw = body.data.password ? await hashPassword(body.data.password) : undefined;
    await mutate(st, (d) => {
      const v = d.videos.find((x) => x.id === idOf(req));
      if (!v) return;
      if (body.data.note !== undefined) v.note = body.data.note;
      if (pw) v.pw = pw;
    });
    res.json({ ok: true });
  }));

  r.delete("/coach/videos/:id", requireCoach, wrap(async (req, res) => {
    const st = storageOr503(res); if (!st) return;
    const rec = (await load(st)).videos.find((v) => v.id === idOf(req));
    if (!rec) return void res.status(404).json({ error: "No such video." });
    await st.remove(rec.key);
    await mutate(st, (d) => { d.videos = d.videos.filter((v) => v.id !== rec.id); });
    res.json({ ok: true });
  }));

  r.get("/coach/videos/:id/play", requireCoach, wrap(async (req, res) => {
    const st = storageOr503(res); if (!st) return;
    const rec = (await load(st)).videos.find((v) => v.id === idOf(req) && v.status === "ready");
    if (!rec) return void res.status(404).json({ error: "No such video." });
    res.json({ url: await st.readUrl(rec.key, config.videoLinkTtlSeconds), expiresIn: config.videoLinkTtlSeconds });
  }));

  // ---- public: the feed shows only that a video exists and when it was posted ----
  r.get("/videos", publicLimiter, wrap(async (_req, res) => {
    const st = getStorage();
    if (!st) return void res.json({ videos: [] });
    const d = await load(st);
    res.json({
      videos: d.videos.filter((v) => v.status === "ready").sort((a, b) => b.createdAt - a.createdAt)
        .map((v) => ({ id: v.id, createdAt: v.createdAt })),
    });
  }));

  r.get("/videos/:id", publicLimiter, wrap(async (req, res) => {
    const st = getStorage();
    const rec = st ? (await load(st)).videos.find((v) => v.id === idOf(req) && v.status === "ready") : undefined;
    if (!rec) return void res.status(404).json({ error: "This video isn't available." });
    res.json({ id: rec.id, createdAt: rec.createdAt });
  }));

  // ---- public: password -> short-lived watch link ----
  r.post("/videos/:id/unlock", unlockLimiter, wrap(async (req, res) => {
    const st = getStorage();
    if (!st) return void res.status(503).json({ error: "Videos are not set up yet." });
    const body = z.object({ password: z.string().min(1).max(200) }).safeParse(req.body);
    if (!body.success) return void res.status(400).json({ error: "Enter the password." });
    const id = idOf(req).slice(0, 40);
    const ipKey = `${req.ip}|${id}`;
    if (blocked(perIpVideo, ipKey, IP_MAX) || blocked(perVideo, id, VIDEO_MAX)) {
      return void res.status(429).json({ error: "Too many wrong tries. Please wait a few minutes and try again." });
    }
    const rec = (await load(st)).videos.find((v) => v.id === id && v.status === "ready");
    const ok = rec ? await verifyPassword(body.data.password, rec.pw) : await fakeVerify(body.data.password);
    if (!rec || !ok) {
      addFail(perIpVideo, ipKey, IP_WINDOW);
      addFail(perVideo, id, VIDEO_WINDOW);
      return void res.status(403).json({ error: "That password didn't work." });
    }
    perIpVideo.delete(ipKey);
    res.json({ url: await st.readUrl(rec.key, config.videoLinkTtlSeconds), expiresIn: config.videoLinkTtlSeconds });
  }));

  return r;
}

/** Remove uploads that were started but never finished (e.g. the browser was closed). */
export async function cleanupStaleUploads() {
  const st = getStorage();
  if (!st) return;
  try {
    const cutoff = Date.now() - 24 * 3600_000;
    const stale = (await load(st)).videos.filter((v) => v.status === "uploading" && v.createdAt < cutoff);
    if (!stale.length) return;
    for (const v of stale) await st.remove(v.key).catch(() => undefined);
    await mutate(st, (d) => { d.videos = d.videos.filter((v) => !(v.status === "uploading" && v.createdAt < cutoff)); });
  } catch (e) {
    console.error("video cleanup failed:", (e as Error).message);
  }
}
