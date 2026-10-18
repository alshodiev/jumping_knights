export type Role = "visitor" | "coach" | "claude" | "system";
export interface Msg { id: number; from: Role; text: string; at: number }
export interface Snapshot {
  rev: number;
  status: "open" | "closed";
  turn: "visitor" | "coach";
  fallback: boolean;
  handedOff: boolean;
  messages: Msg[];
}

import { API_URL as API } from "./api";

async function json<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  return data as T;
}

export async function startChat(topic: string) {
  return json<{ sessionId: string; token: string; snapshot: Snapshot }>(
    await fetch(`${API}/api/chat/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    }),
  );
}

export interface VisitorName { firstName: string; lastName: string }

export async function sendMessage(id: string, token: string, text: string, name?: VisitorName) {
  return json<{ snapshot: Snapshot }>(
    await fetch(`${API}/api/chat/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-chat-token": token },
      body: JSON.stringify({ text, ...(name ?? {}) }),
    }),
  );
}

export function closeChat(id: string, token: string) {
  void fetch(`${API}/api/chat/${id}/close`, {
    method: "POST",
    headers: { "x-chat-token": token },
    keepalive: true,
  }).catch(() => {});
}

export function openEvents(id: string, token: string, onSnapshot: (s: Snapshot) => void) {
  const es = new EventSource(`${API}/api/chat/${id}/events?token=${encodeURIComponent(token)}`);
  es.onmessage = (e) => onSnapshot(JSON.parse(e.data) as Snapshot);
  return es;
}
