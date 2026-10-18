import crypto from "node:crypto";
import type { ServerResponse } from "node:http";
import { config, TOPICS } from "./config.js";
import { Session, Msg, Role, getSession, putSession, findByThread, persist } from "./store.js";
import { greetingQuestion, coachSummary, claudeEnabled } from "./claude.js";
import * as tg from "./telegram.js";
import { etStamp, nameLabel, oneLine } from "./format.js";

const MAX_VISITOR_MESSAGES = 30;
const MAX_LEN = 1000;
const subscribers = new Map<string, Set<ServerResponse>>();
const timers = new Map<string, NodeJS.Timeout>();
let mockThread = 1000;

export const isTopic = (t: string) => (TOPICS as readonly string[]).includes(t);

export function snapshot(s: Session) {
  return {
    rev: s.rev,
    status: s.status,
    turn: s.turn,
    fallback: s.fallback,
    handedOff: s.handedOff,
    messages: s.messages,
  };
}

function broadcast(s: Session) {
  s.rev++;
  s.lastActivity = Date.now();
  persist();
  const data = `data: ${JSON.stringify(snapshot(s))}\n\n`;
  subscribers.get(s.id)?.forEach((res) => res.write(data));
}

function add(s: Session, from: Role, text: string) {
  const m: Msg = { id: s.messages.length + 1, from, text, at: Date.now() };
  s.messages.push(m);
  return m;
}

export function subscribe(s: Session, res: ServerResponse) {
  let set = subscribers.get(s.id);
  if (!set) subscribers.set(s.id, (set = new Set()));
  set.add(res);
  res.write(`data: ${JSON.stringify(snapshot(s))}\n\n`);
  return () => {
    set!.delete(res);
  };
}

export function authorize(id: string, token: string | undefined): Session | null {
  const s = getSession(id);
  if (!s || !token) return null;
  const a = Buffer.from(s.token);
  const b = Buffer.from(token);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return s;
}

export async function startSession(topic: string) {
  const question = await greetingQuestion(topic);
  const now = Date.now();
  const s: Session = {
    id: crypto.randomUUID(),
    token: crypto.randomBytes(24).toString("hex"),
    topic,
    createdAt: now,
    lastActivity: now,
    status: "open",
    turn: "visitor",
    fallback: false,
    handedOff: false,
    threadId: null,
    rev: 0,
    messages: [],
    visitorCount: 0,
  };
  add(s, "claude", `Hello. I see you are trying to register for ${topic}. ${question}`);
  putSession(s);
  return s;
}

const clean = (t: string) => t.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, MAX_LEN);

async function post(s: Session, text: string) {
  if (s.threadId === null) return;
  if (!tg.telegramEnabled) {
    console.log(`[mock-telegram thread ${s.threadId}] ${text}`);
    return;
  }
  await tg.sendToTopic(s.threadId, text);
}

function startCoachTimer(s: Session) {
  clearTimeout(timers.get(s.id));
  timers.set(
    s.id,
    setTimeout(() => {
      if (s.status !== "open" || s.turn !== "coach") return;
      s.turn = "visitor";
      s.fallback = true;
      add(
        s,
        "system",
        "Coach hasn't replied yet. Please leave your phone number or email and your question, and we'll get back to you.",
      );
      broadcast(s);
      void post(s, "⏱ 5 minutes passed. The visitor was asked to leave contact details.").catch(() => {});
    }, config.coachTimeoutMs),
  );
}

export type SendResult = { ok: true } | { ok: false; code: number; error: string };
export interface VisitorName { firstName?: string; lastName?: string }

export async function visitorMessage(s: Session, raw: string, name: VisitorName = {}): Promise<SendResult> {
  const text = clean(raw);
  if (s.status !== "open") return { ok: false, code: 409, error: "Chat has ended." };
  if (s.turn !== "visitor") return { ok: false, code: 409, error: "Please wait for a reply." };
  if (!text) return { ok: false, code: 400, error: "Empty message." };
  if (s.visitorCount >= MAX_VISITOR_MESSAGES) return { ok: false, code: 429, error: "Message limit reached." };

  if (!s.handedOff) {
    const first = oneLine(name.firstName ?? "").slice(0, 60);
    const last = oneLine(name.lastName ?? "").slice(0, 60);
    if (!first || !last) return { ok: false, code: 400, error: "Please enter your first and last name." };
    s.firstName = first;
    s.lastName = last;
  }
  const who = nameLabel(s.lastName ?? "", s.firstName ?? "");
  const stamp = `${who} · ${etStamp()}`; // "Last, First · Oct 17, 2026, 8:21 PM ET"

  s.visitorCount++;
  add(s, "visitor", text);
  const wasFallback = s.fallback;
  s.turn = "coach";

  try {
    if (!s.handedOff) {
      s.handedOff = true;
      add(s, "system", "Connecting you with Coach…");
      broadcast(s);
      s.threadId = tg.telegramEnabled
        ? await tg.createTopic(`${who} · ${s.topic}`)
        : mockThread++;
      persist();
      await post(s, `New registration chat\nName: ${who}\nButton clicked: ${s.topic}\nStarted: ${etStamp()}\nReply in this topic to answer the visitor. Send /close to end the chat.`);
      await post(s, `${stamp}\n${text}`);
      startCoachTimer(s);
      if (claudeEnabled) {
        void coachSummary(s.topic, text)
          .then(async (sum) => { if (sum) await post(s, `Claude summary: ${sum}`); })
          .catch(() => {});
      }
    } else if (wasFallback) {
      s.fallback = false;
      add(s, "system", "Thanks, we've passed that along. Coach will be in touch.");
      broadcast(s);
      await post(s, `📩 ${stamp} (sent after the 5-minute timeout)\n${text}`);
    } else {
      broadcast(s);
      await post(s, `${stamp}\n${text}`);
      startCoachTimer(s);
    }
  } catch (e) {
    console.error("handoff failed:", (e as Error).message);
    s.turn = "visitor";
    s.fallback = true;
    add(s, "system", "We couldn't reach the coach right now. Please leave your phone number or email and we'll follow up.");
    broadcast(s);
    return { ok: true };
  }
  broadcast(s);
  return { ok: true };
}

export function coachMessage(threadId: number, text: string) {
  const s = findByThread(threadId);
  if (!s) {
    if (tg.isClientsThread(threadId)) console.log(`[telegram] thread ${threadId} is the Potential Clients log, not a live chat: message ignored (contact the person by the email/phone they left)`);
    else console.log(`[telegram] thread ${threadId} matches no saved chat (was it created by a different bot/group?)`);
    return;
  }
  if (s.status !== "open") { console.log(`[telegram] chat for thread ${threadId} is already closed`); return; }
  const t = text.trim();
  if (t === "/close" || t.startsWith("/close@")) {
    closeSession(s, "coach");
    return;
  }
  if (t.startsWith("/")) return;
  clearTimeout(timers.get(s.id));
  add(s, "coach", clean(t));
  s.turn = "visitor";
  s.fallback = false;
  broadcast(s);
}

export function closeSession(s: Session, by: "coach" | "visitor") {
  if (s.status === "closed") return;
  clearTimeout(timers.get(s.id));
  s.status = "closed";
  add(s, "system", by === "coach" ? "Coach ended the chat. Thank you!" : "Chat closed.");
  broadcast(s);
  if (s.handedOff && by === "visitor") void post(s, "Visitor closed the chat.").catch(() => {});
  if (s.threadId !== null && tg.telegramEnabled) void tg.closeTopic(s.threadId);
}
