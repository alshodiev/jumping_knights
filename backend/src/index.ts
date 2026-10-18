import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { config } from "./config.js";
import { loadSessions, cleanup, getSession } from "./store.js";
import * as chat from "./chat.js";
import * as tg from "./telegram.js";
import { etStamp, nameLabel, oneLine } from "./format.js";

loadSessions();
setInterval(() => cleanup(), 3600_000).unref();

const app = express();
if (config.trustProxy) app.set("trust proxy", config.trustProxy);
app.disable("x-powered-by");
app.use(
  cors({
    origin(origin, cb) {
      // allow same-origin tools (no Origin header) and listed sites only
      const devLocal = !config.isProd && !!origin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
      cb(null, !origin || devLocal || config.allowedOrigins.includes(origin));
    },
  }),
);
app.use(express.json({ limit: "4kb" }));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

const startLimiter = rateLimit({ windowMs: 3600_000, limit: config.startLimitPerHour, standardHeaders: true, legacyHeaders: false });
const msgLimiter = rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false });

const wrap = (fn: (req: Request, res: Response) => Promise<unknown> | unknown) =>
  (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res)).catch(next);

const idOf = (req: Request) => String(req.params.id);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, telegram: tg.telegramEnabled });
});

app.post("/api/chat/start", startLimiter, wrap(async (req, res) => {
  const body = z.object({ topic: z.string() }).safeParse(req.body);
  if (!body.success || !chat.isTopic(body.data.topic)) return res.status(400).json({ error: "Unknown topic." });
  const s = await chat.startSession(body.data.topic);
  res.json({ sessionId: s.id, token: s.token, snapshot: chat.snapshot(s) });
}));

app.post("/api/chat/:id/messages", msgLimiter, wrap(async (req, res) => {
  const s = chat.authorize(idOf(req), req.header("x-chat-token"));
  if (!s) return res.status(401).json({ error: "Unauthorized." });
  const body = z.object({ text: z.string().max(2000), firstName: z.string().max(100).optional(), lastName: z.string().max(100).optional() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid message." });
  const r = await chat.visitorMessage(s, body.data.text, { firstName: body.data.firstName, lastName: body.data.lastName });
  if (!r.ok) return res.status(r.code).json({ error: r.error });
  res.json({ snapshot: chat.snapshot(s) });
}));

const contactLimiter = rateLimit({ windowMs: 3600_000, limit: 5, standardHeaders: true, legacyHeaders: false });

app.post("/api/contact", contactLimiter, wrap(async (req, res) => {
  const body = z.object({
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(60),
    email: z.string().trim().email().max(120),
    phone: z.string().trim().max(30).optional().default(""),
    message: z.string().trim().min(1).max(2000),
    website: z.string().optional(), // honeypot: real visitors leave this empty
  }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Please fill in your name, a valid email and a message." });
  const d = body.data;
  if (d.website) return res.json({ ok: true }); // bot: pretend success, send nothing
  const text =
    `New contact form message\n` +
    `${nameLabel(d.lastName, d.firstName)} · ${etStamp()}\n` +
    `Email: ${oneLine(d.email)}\n` +
    `Phone: ${oneLine(d.phone) || "not given"}\n\n${d.message}`;
  if (!tg.telegramEnabled) {
    console.log("[mock-telegram contact]\n" + text);
    return res.json({ ok: true });
  }
  try {
    await tg.sendToClients(text);
  } catch (e) {
    console.error("contact relay failed:", (e as Error).message);
    return res.status(502).json({ error: "We couldn't deliver your message right now." });
  }
  res.json({ ok: true });
}));

app.post("/api/chat/:id/close", wrap((req, res) => {
  const s = chat.authorize(idOf(req), req.header("x-chat-token"));
  if (!s) return res.status(401).json({ error: "Unauthorized." });
  chat.closeSession(s, "visitor");
  res.json({ ok: true });
}));

app.get("/api/chat/:id/events", (req, res) => {
  const s = chat.authorize(idOf(req), typeof req.query.token === "string" ? req.query.token : undefined);
  if (!s) return void res.status(401).end();
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write("retry: 3000\n\n");
  const unsubscribe = chat.subscribe(s, res);
  const beat = setInterval(() => res.write(": ping\n\n"), 25_000);
  req.on("close", () => { clearInterval(beat); unsubscribe(); });
});

// Dev only: lets you "reply as the coach" without Telegram.
if (!config.isProd && !tg.telegramEnabled) {
  app.post("/api/dev/coach-reply", (req, res) => {
    const body = z.object({ sessionId: z.string(), text: z.string() }).safeParse(req.body);
    if (!body.success) return void res.status(400).json({ error: "bad body" });
    const found = getSession(body.data.sessionId);
    if (!found || found.threadId === null) return void res.status(404).json({ error: "no such handed-off session" });
    chat.coachMessage(found.threadId, body.data.text);
    res.json({ ok: true });
  });
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Server error." });
});

app.listen(config.port, () => {
  console.log(`API on http://localhost:${config.port}  telegram=${tg.telegramEnabled}  claude=${Boolean(config.anthropicKey)}`);
  if (!tg.telegramEnabled) console.log("Telegram not configured: dev mock mode (POST /api/dev/coach-reply to answer as coach).");
});
tg.startPolling((threadId, text) => chat.coachMessage(threadId, text));
