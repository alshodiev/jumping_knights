/**
 * End-to-end security test for the private video library.
 * Runs the real backend (local storage mode) and tries to get in the wrong way.
 * Run with:  npm test
 */
import fs from "node:fs";
import { spawn } from "node:child_process";
import { hashPassword } from "../src/auth.js";

const PORT = 9921;
const DATA = `/tmp/jk-video-test-${Date.now()}`;
const COACH_PW = "coach-pass-12345";
const ORIGIN = "http://localhost:5173";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (name: string, ok: boolean, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  " + extra}`); if (!ok) failures++; };
const base = `http://localhost:${PORT}`;

interface R { status: number; json: any; headers: Headers }
async function call(method: string, path: string, o: { body?: unknown; cookie?: string; csrf?: boolean; origin?: string; ip?: string } = {}): Promise<R> {
  const headers: Record<string, string> = {};
  if (o.body !== undefined) headers["Content-Type"] = "application/json";
  if (o.cookie) headers.Cookie = o.cookie;
  if (o.csrf !== false && method !== "GET") headers["X-JK-CSRF"] = "1";
  if (o.origin) headers.Origin = o.origin;
  if (o.ip) headers["X-Forwarded-For"] = o.ip;
  const res = await fetch(base + path, { method, headers, body: o.body !== undefined ? JSON.stringify(o.body) : undefined });
  const text = await res.text();
  let json: any = null; try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, headers: res.headers };
}
const cookieOf = (r: R) => (r.headers.get("set-cookie") ?? "").split(";")[0];

async function main() {
  const hash = await hashPassword(COACH_PW);
  const server = spawn("npx", ["tsx", "src/index.ts"], {
    env: { ...process.env, PORT: String(PORT), DATA_DIR: DATA, NODE_ENV: "development", ALLOWED_ORIGINS: ORIGIN, TRUST_PROXY: "1",
      COACH_USERNAME: "murad", COACH_PASSWORD_HASH: hash, SESSION_SECRET: "test-secret-test-secret-test-secret",
      PUBLIC_API_URL: base, MAX_VIDEO_MB: "2", VIDEO_LINK_TTL_SECONDS: "3", TELEGRAM_BOT_TOKEN: "", ANTHROPIC_API_KEY: "",
      R2_ACCOUNT_ID: "", R2_BUCKET: "" },
    stdio: ["ignore", "inherit", "inherit"], detached: true,
  });
  try {
    for (let i = 0; i < 60; i++) { try { if ((await call("GET", "/api/health")).status === 200) break; } catch {} await sleep(250); }

    // ---------- nothing works without signing in ----------
    check("public feed starts empty", (await call("GET", "/api/videos")).json?.videos?.length === 0);
    for (const [m, p] of [["GET", "/api/coach/videos"], ["POST", "/api/coach/videos"], ["PATCH", "/api/coach/videos/x"], ["DELETE", "/api/coach/videos/x"], ["GET", "/api/coach/videos/x/play"], ["POST", "/api/coach/videos/x/complete"]] as const)
      check(`coach route ${m} ${p} needs sign-in`, (await call(m, p, { body: m === "GET" ? undefined : {} })).status === 401);

    // ---------- coach sign-in ----------
    check("wrong password rejected", (await call("POST", "/api/coach/login", { body: { username: "murad", password: "nope-nope-nope" } })).status === 401);
    check("wrong username rejected", (await call("POST", "/api/coach/login", { body: { username: "someone", password: COACH_PW } })).status === 401);
    const login = await call("POST", "/api/coach/login", { body: { username: "murad", password: COACH_PW } });
    check("right credentials accepted", login.status === 200);
    const setCookie = login.headers.get("set-cookie") ?? "";
    check("cookie is HttpOnly + SameSite", /HttpOnly/i.test(setCookie) && /SameSite=Lax/i.test(setCookie), setCookie);
    const cookie = cookieOf(login);
    check("cookie holds no password", !cookie.includes(COACH_PW));
    check("me: signed in", (await call("GET", "/api/coach/me", { cookie })).json?.signedIn === true);
    check("tampered cookie rejected", (await call("GET", "/api/coach/videos", { cookie: cookie.slice(0, -3) + "AAA" })).status === 401);
    check("forged cookie rejected", (await call("GET", "/api/coach/videos", { cookie: `jk_coach=coach.${Date.now() + 1e9}.forged` })).status === 401);

    // ---------- CSRF guards on changes ----------
    const good = { note: "Sam: forks", password: "knight-moves-77", size: 1_000_000, contentType: "video/mp4" };
    check("change without CSRF header blocked", (await call("POST", "/api/coach/videos", { cookie, body: good, csrf: false })).status === 403);
    check("change from unknown website blocked", (await call("POST", "/api/coach/videos", { cookie, body: good, origin: "https://evil.example" })).status === 403);

    // ---------- create / upload validation ----------
    check("short password rejected", (await call("POST", "/api/coach/videos", { cookie, body: { ...good, password: "short" } })).status === 400);
    check("non-mp4 rejected", (await call("POST", "/api/coach/videos", { cookie, body: { ...good, contentType: "application/x-msdownload" } })).status === 400);
    check("oversize rejected", (await call("POST", "/api/coach/videos", { cookie, body: { ...good, size: 3 * 1024 * 1024 } })).status === 413);

    const c1 = await call("POST", "/api/coach/videos", { cookie, body: good });
    check("create returns id + upload target", c1.status === 200 && !!c1.json?.id && !!c1.json?.upload?.url, JSON.stringify(c1.json));
    const id: string = c1.json.id;
    const url: string = c1.json.upload.url;

    check("not listed publicly while uploading", (await call("GET", "/api/videos")).json.videos.length === 0);
    check("cannot unlock while uploading", (await call("POST", `/api/videos/${id}/unlock`, { body: { password: good.password }, ip: "10.0.0.1" })).status === 403);
    check("complete before the upload arrives -> 409", (await call("POST", `/api/coach/videos/${id}/complete`, { cookie })).status === 409);

    const bytes = Buffer.alloc(1_000_000, 7);
    const badPut = await fetch(url.replace(/sig=[^&]+/, "sig=bad"), { method: "PUT", body: bytes });
    check("upload with a bad signature refused", badPut.status === 403);
    const put = await fetch(url, { method: "PUT", headers: { "Content-Type": "video/mp4" }, body: bytes });
    check("upload with the real link works", put.status === 200, String(put.status));
    check("complete works after upload", (await call("POST", `/api/coach/videos/${id}/complete`, { cookie })).status === 200);

    // ---------- the public feed leaks nothing ----------
    const feed = await call("GET", "/api/videos");
    check("feed lists the video", feed.json.videos.length === 1 && feed.json.videos[0].id === id);
    check("feed shows ONLY id + date", JSON.stringify(Object.keys(feed.json.videos[0]).sort()) === JSON.stringify(["createdAt", "id"]), JSON.stringify(feed.json));
    const single = await call("GET", `/api/videos/${id}`);
    check("single video info shows only id + date", JSON.stringify(Object.keys(single.json).sort()) === JSON.stringify(["createdAt", "id"]));
    check("unknown video id -> 404", (await call("GET", "/api/videos/doesnotexist")).status === 404);
    const coachList = await call("GET", "/api/coach/videos", { cookie });
    check("coach list has note but never a password hash", coachList.json.videos[0].note === "Sam: forks" && !JSON.stringify(coachList.json).includes("scrypt"));
    const dbText = fs.readFileSync(`${DATA}/storage/jk/videos.json`, "utf8");
    check("records file never contains a plain password", !dbText.includes(good.password) && dbText.includes("scrypt:"));

    // ---------- the password gate ----------
    const wrong = await call("POST", `/api/videos/${id}/unlock`, { body: { password: "wrong-password" }, ip: "10.0.0.2" });
    const ghost = await call("POST", `/api/videos/zzzzzzzzzzzz/unlock`, { body: { password: "wrong-password" }, ip: "10.0.0.2" });
    check("wrong password refused", wrong.status === 403);
    check("unknown id looks identical to wrong password", ghost.status === 403 && JSON.stringify(ghost.json) === JSON.stringify(wrong.json));
    const un = await call("POST", `/api/videos/${id}/unlock`, { body: { password: good.password }, ip: "10.0.0.2" });
    check("right password gives a watch link", un.status === 200 && typeof un.json?.url === "string");
    check("watch link is not cacheable", (un.headers.get("cache-control") ?? "").includes("no-store"));
    const watch = await fetch(un.json.url);
    const got = Buffer.from(await watch.arrayBuffer());
    check("watch link streams the video", watch.status === 200 && got.length === bytes.length && got.equals(bytes));
    const part = await fetch(un.json.url, { headers: { Range: "bytes=0-99" } });
    check("seeking works (Range -> 206)", part.status === 206 && (await part.arrayBuffer()).byteLength === 100, String(part.status));
    check("tampered watch link refused", (await fetch(un.json.url.replace(/sig=[^&]+/, "sig=bad"))).status === 403);
    check("file is not reachable without a signed link", (await fetch(`${base}/api/_local-storage/videos/${id}.mp4`)).status === 403);
    check("path tricks refused", (await fetch(`${base}/api/_local-storage/..%2F..%2Fetc%2Fpasswd?exp=${Date.now() + 1e6}&sig=x`)).status === 403);
    await sleep(3300);
    check("watch link expires", (await fetch(un.json.url)).status === 403);

    // ---------- guessing protection ----------
    const c2 = await call("POST", "/api/coach/videos", { cookie, body: { ...good, note: "lock test", password: "lock-test-pass-1" } });
    await fetch(c2.json.upload.url, { method: "PUT", body: bytes });
    await call("POST", `/api/coach/videos/${c2.json.id}/complete`, { cookie });
    const v2 = c2.json.id;
    let last = 0;
    for (let i = 0; i < 5; i++) last = (await call("POST", `/api/videos/${v2}/unlock`, { body: { password: `guess-${i}-xx` }, ip: "10.1.1.1" })).status;
    check("5 wrong guesses are all refused", last === 403);
    check("6th try from the same address is blocked, even with the RIGHT password", (await call("POST", `/api/videos/${v2}/unlock`, { body: { password: "lock-test-pass-1" }, ip: "10.1.1.1" })).status === 429);
    check("another video is unaffected by that lock", (await call("POST", `/api/videos/${id}/unlock`, { body: { password: good.password }, ip: "10.1.1.1" })).status === 200);
    for (let i = 0; i < 8; i++) await call("POST", `/api/videos/${v2}/unlock`, { body: { password: `spread-${i}-xx` }, ip: `10.2.2.${i + 1}` });
    check("guessing from many addresses locks that video", (await call("POST", `/api/videos/${v2}/unlock`, { body: { password: "lock-test-pass-1" }, ip: "10.3.3.3" })).status === 429);

    // ---------- coach edits ----------
    const c3 = await call("POST", "/api/coach/videos", { cookie, body: { ...good, note: "edit test", password: "first-password-1" } });
    await fetch(c3.json.upload.url, { method: "PUT", body: bytes });
    await call("POST", `/api/coach/videos/${c3.json.id}/complete`, { cookie });
    const v3 = c3.json.id;
    check("coach can change note + password", (await call("PATCH", `/api/coach/videos/${v3}`, { cookie, body: { note: "renamed", password: "second-password-2" } })).status === 200);
    check("old password no longer works", (await call("POST", `/api/videos/${v3}/unlock`, { body: { password: "first-password-1" }, ip: "10.4.4.4" })).status === 403);
    check("new password works", (await call("POST", `/api/videos/${v3}/unlock`, { body: { password: "second-password-2" }, ip: "10.4.4.4" })).status === 200);
    check("short new password refused", (await call("PATCH", `/api/coach/videos/${v3}`, { cookie, body: { password: "tiny" } })).status === 400);
    const play = await call("GET", `/api/coach/videos/${v3}/play`, { cookie });
    check("coach can watch without a password", play.status === 200 && (await fetch(play.json.url)).status === 200);

    // ---------- delete ----------
    const watch3 = (await call("POST", `/api/videos/${v3}/unlock`, { body: { password: "second-password-2" }, ip: "10.4.4.5" })).json.url;
    check("coach can delete", (await call("DELETE", `/api/coach/videos/${v3}`, { cookie })).status === 200);
    check("deleted video leaves the feed", !(await call("GET", "/api/videos")).json.videos.some((v: any) => v.id === v3));
    check("deleted video can't be unlocked", (await call("POST", `/api/videos/${v3}/unlock`, { body: { password: "second-password-2" }, ip: "10.4.4.6" })).status === 403);
    check("old watch link of a deleted video is dead", (await fetch(watch3)).status === 404);

    // ---------- sign out ----------
    check("logout works", (await call("POST", "/api/coach/logout", { cookie })).status === 200);
    check("sign-in cookie is cleared by the browser on logout", /jk_coach=;/.test((await call("POST", "/api/coach/logout", { cookie })).headers.get("set-cookie") ?? ""));

    // ---------- sign-in rate limit (last, it blocks this address) ----------
    let status = 0;
    for (let i = 0; i < 10; i++) status = (await call("POST", "/api/coach/login", { body: { username: "murad", password: `bad-${i}-password` }, ip: "10.9.9.9" })).status;
    check("repeated bad sign-ins get blocked", status === 429, String(status));
    check("even the right password is blocked after that", (await call("POST", "/api/coach/login", { body: { username: "murad", password: COACH_PW }, ip: "10.9.9.9" })).status === 429);
  } finally {
    try { process.kill(-server.pid!, "SIGTERM"); } catch {} fs.rmSync(DATA, { recursive: true, force: true });
    setTimeout(() => process.exit(failures ? 1 : 0), 200);
  }
  console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
}
main();
