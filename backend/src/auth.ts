import crypto from "node:crypto";
import { promisify } from "node:util";
import type { NextFunction, Request, Response } from "express";
import { config } from "./config.js";

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, len: number, opts: crypto.ScryptOptions) => Promise<Buffer>;
const N = 16384, R = 8, P = 1, KEYLEN = 64;
const OPTS: crypto.ScryptOptions = { N, r: R, p: P, maxmem: 64 * 1024 * 1024 };

// ---------- password hashing (scrypt, random salt, constant-time compare) ----------

/** Format: scrypt:N:r:p:salt:hash  (no "$" so it pastes safely into env var screens) */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN, OPTS);
  return ["scrypt", N, R, P, salt.toString("base64url"), hash.toString("base64url")].join(":");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, "base64url");
  const want = Buffer.from(hashB64, "base64url");
  if (!salt.length || !want.length) return false;
  const got = await scrypt(password, salt, want.length, { N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 });
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

let dummy: Promise<string> | null = null;
/** Burns the same time as a real check, so "no such video" and "wrong password" look identical. */
export async function fakeVerify(password: string): Promise<false> {
  dummy ??= hashPassword("not-a-real-password");
  await verifyPassword(password, await dummy);
  return false;
}

// ---------- signed values (cookie + local-storage links) ----------

const devSecret = crypto.randomBytes(32).toString("hex");
export const secret = () => config.sessionSecret || devSecret; // dev: random per start

export function sign(value: string): string {
  const mac = crypto.createHmac("sha256", secret()).update(value).digest("base64url");
  return `${value}.${mac}`;
}
export function unsign(signed: string): string | null {
  const i = signed.lastIndexOf(".");
  if (i < 1) return null;
  const value = signed.slice(0, i);
  const mac = Buffer.from(signed.slice(i + 1));
  const want = Buffer.from(crypto.createHmac("sha256", secret()).update(value).digest("base64url"));
  return mac.length === want.length && crypto.timingSafeEqual(mac, want) ? value : null;
}

// ---------- coach session cookie ----------

export const COOKIE = "jk_coach";
const SESSION_HOURS = 12;

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

const cookieOpts = () => ({
  httpOnly: true,
  secure: config.isProd || config.cookieSameSite === "none",
  sameSite: config.cookieSameSite,
  path: "/",
  domain: config.cookieDomain,
});

export function startCoachSession(res: Response) {
  const exp = Date.now() + SESSION_HOURS * 3600_000;
  res.cookie(COOKIE, sign(`coach.${exp}`), { ...cookieOpts(), maxAge: SESSION_HOURS * 3600_000 });
}
export function endCoachSession(res: Response) {
  res.clearCookie(COOKIE, cookieOpts());
}
export function isCoach(req: Request): boolean {
  const c = readCookie(req, COOKIE);
  const v = c && unsign(c);
  if (!v) return false;
  const [who, exp] = v.split(".");
  return who === "coach" && Number(exp) > Date.now();
}

/**
 * Protects coach routes. Besides the cookie, changes (POST/PATCH/DELETE) must carry a custom header
 * and come from an allowed site, so another website can't trigger them in the coach's browser.
 */
export function requireCoach(req: Request, res: Response, next: NextFunction) {
  if (!isCoach(req)) return void res.status(401).json({ error: "Please sign in." });
  if (req.method !== "GET" && req.method !== "HEAD") {
    const origin = req.header("origin");
    const devLocal = !config.isProd && !!origin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
    const originOk = !origin || devLocal || config.allowedOrigins.includes(origin);
    if (req.header("x-jk-csrf") !== "1" || !originOk) return void res.status(403).json({ error: "Request blocked." });
  }
  next();
}
