import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";

export type Role = "visitor" | "coach" | "claude" | "system";
export interface Msg { id: number; from: Role; text: string; at: number }
export interface Session {
  id: string;
  token: string;
  topic: string;
  createdAt: number;
  lastActivity: number;
  status: "open" | "closed";
  /** Whose turn it is. The visitor can only send while turn === "visitor". */
  turn: "visitor" | "coach";
  /** True after the coach did not answer in time. */
  fallback: boolean;
  handedOff: boolean;
  threadId: number | null;
  rev: number;
  messages: Msg[];
  visitorCount: number;
  firstName?: string;
  lastName?: string;
}

const sessions = new Map<string, Session>();
const file = path.join(config.dataDir, "sessions.json");
let timer: NodeJS.Timeout | null = null;

export function loadSessions() {
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as Session[];
    for (const s of raw) sessions.set(s.id, s);
  } catch {
    /* first run */
  }
}

export function persist() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    try {
      fs.mkdirSync(config.dataDir, { recursive: true });
      const tmp = file + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify([...sessions.values()]));
      fs.renameSync(tmp, file);
    } catch (e) {
      console.error("persist failed", e);
    }
  }, 500);
}

export const getSession = (id: string) => sessions.get(id);
export const putSession = (s: Session) => { sessions.set(s.id, s); persist(); };
export const findByThread = (threadId: number) =>
  [...sessions.values()].find((s) => s.threadId === threadId);

export function cleanup(maxAgeMs = 24 * 3600 * 1000) {
  const cutoff = Date.now() - maxAgeMs;
  for (const [id, s] of sessions) if (s.lastActivity < cutoff) sessions.delete(id);
  persist();
}

// Small bits of state that must survive restarts (e.g. the Potential Clients topic id).
const metaFile = path.join(config.dataDir, "meta.json");
export interface Meta { clientsThreadId?: number }
export function readMeta(): Meta {
  try { return JSON.parse(fs.readFileSync(metaFile, "utf8")) as Meta; } catch { return {}; }
}
export function writeMeta(m: Meta) {
  try {
    fs.mkdirSync(config.dataDir, { recursive: true });
    fs.writeFileSync(metaFile, JSON.stringify(m));
  } catch (e) {
    console.error("writeMeta failed", e);
  }
}
