import { config } from "./config.js";
import { readMeta, writeMeta } from "./store.js";

export const telegramEnabled = Boolean(config.tgToken && config.tgGroupId && config.tgCoachId);

async function call<T = any>(method: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${config.tgApiBase}/bot${config.tgToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const json = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!json.ok) throw new Error(`telegram ${method}: ${json.description ?? res.status}`);
  return json.result;
}

export async function createTopic(name: string): Promise<number> {
  const r = await call<{ message_thread_id: number }>("createForumTopic", {
    chat_id: config.tgGroupId,
    name: name.slice(0, 120),
  });
  return r.message_thread_id;
}

export async function sendToTopic(threadId: number, text: string): Promise<void> {
  // Plain text only (no parse_mode) so visitor text can never inject formatting or links.
  await call("sendMessage", {
    chat_id: config.tgGroupId,
    message_thread_id: threadId,
    text: text.slice(0, 4000),
    link_preview_options: { is_disabled: true },
  });
}

let clientsThread: number | null = null;
let creatingClients: Promise<number> | null = null;

async function ensureClientsThread(): Promise<number> {
  if (clientsThread) return clientsThread;
  if (config.tgClientsThreadId) return (clientsThread = config.tgClientsThreadId);
  const saved = readMeta().clientsThreadId;
  if (saved) return (clientsThread = saved);
  // one creator at a time, so two simultaneous first messages don't make two topics
  creatingClients ??= createTopic(config.tgClientsTopicName)
    .then((id) => { clientsThread = id; writeMeta({ ...readMeta(), clientsThreadId: id }); return id; })
    .finally(() => { creatingClients = null; });
  return creatingClients;
}

/** True if this thread is the Potential Clients log (not a visitor chat). */
export function isClientsThread(id: number): boolean {
  return id === clientsThread || id === config.tgClientsThreadId || id === readMeta().clientsThreadId;
}

/** All contact-form messages go to ONE topic ("Potential Clients"), created on first use. */
export async function sendToClients(text: string): Promise<void> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const id = await ensureClientsThread();
    try {
      await sendToTopic(id, text);
      return;
    } catch (e) {
      // topic was deleted in Telegram: forget it and create a new one, once
      if (attempt === 0 && /thread not found|TOPIC_ID_INVALID|topic.*(deleted|not found)/i.test((e as Error).message)) {
        clientsThread = null;
        if (!config.tgClientsThreadId) writeMeta({ ...readMeta(), clientsThreadId: undefined });
        continue;
      }
      throw e;
    }
  }
}

export async function closeTopic(threadId: number): Promise<void> {
  try {
    await call("closeForumTopic", { chat_id: config.tgGroupId, message_thread_id: threadId });
  } catch {
    /* needs "manage topics" right; not critical */
  }
}

interface Update {
  update_id: number;
  message?: {
    message_thread_id?: number;
    text?: string;
    chat: { id: number };
    from?: { id: number };
  };
}

/** Long-polling loop: no public URL or webhook needed. */
export function startPolling(onCoachText: (threadId: number, text: string) => void) {
  if (!telegramEnabled) return;
  let offset = 0;
  const loop = async () => {
    try {
      await call("deleteWebhook", {}).catch(() => {});
      for (;;) {
        try {
          const updates = await call<Update[]>("getUpdates", {
            offset,
            timeout: 25,
            allowed_updates: ["message"],
          });
          for (const u of updates) {
            offset = u.update_id + 1;
            const m = u.message;
            if (!m?.text) continue;
            const tag = `[telegram] msg from user ${m.from?.id} in chat ${m.chat.id} thread ${m.message_thread_id ?? "none"}`;
            if (String(m.chat.id) !== String(config.tgGroupId)) {
              console.log(`${tag} IGNORED: chat id does not match TELEGRAM_GROUP_ID (${config.tgGroupId})`);
              continue;
            }
            if (String(m.from?.id) !== String(config.tgCoachId)) {
              console.log(`${tag} IGNORED: user id does not match TELEGRAM_COACH_USER_ID (${config.tgCoachId})`);
              continue;
            }
            if (!m.message_thread_id) {
              console.log(`${tag} IGNORED: not inside a visitor topic (General area?)`);
              continue;
            }
            console.log(`${tag} accepted`);
            onCoachText(m.message_thread_id, m.text);
          }
        } catch (e) {
          console.error("telegram poll error:", (e as Error).message);
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    } catch (e) {
      console.error("telegram loop crashed", e);
    }
  };
  void loop();
  console.log("Telegram polling started");
}
