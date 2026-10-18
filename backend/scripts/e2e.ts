/**
 * End-to-end test: runs the real backend against a FAKE Telegram API.
 * Run with:  npm test
 */
import http from "node:http";
import { spawn } from "node:child_process";

const TG_PORT = 9911, API_PORT = 9912;
const TOKEN = "TEST", GROUP = "-100123", COACH = "777";
const sent: any[] = [];
const queue: any[] = [];
let nextThread = 5, updateId = 1;
const pollers: Array<() => void> = [];

const fake = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const method = req.url!.split("/").pop()!;
    const j = body ? JSON.parse(body) : {};
    const reply = (result: unknown) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ ok: true, result })); };
    if (method === "createForumTopic") { sent.push({ method, ...j }); return reply({ message_thread_id: nextThread++ }); }
    if (method === "sendMessage" || method === "closeForumTopic") { sent.push({ method, ...j }); return reply({}); }
    if (method === "getUpdates") {
      let done = false;
      const flush = () => { if (done) return; done = true; reply(queue.splice(0)); };
      if (queue.length) return flush();
      const t = setTimeout(flush, 1500); pollers.push(() => { clearTimeout(t); flush(); });
      return;
    }
    reply(true);
  });
});
const pushUpdate = (thread: number, from: string, text: string) => {
  queue.push({ update_id: updateId++, message: { message_thread_id: thread, text, chat: { id: Number(GROUP) }, from: { id: Number(from) } } });
  pollers.splice(0).forEach((f) => f());
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (name: string, ok: boolean, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  " + extra}`); if (!ok) failures++; };
const api = (path: string, init?: RequestInit) => fetch(`http://localhost:${API_PORT}${path}`, init);
const post = (path: string, body: unknown, token?: string) =>
  api(path, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { "x-chat-token": token } : {}) }, body: JSON.stringify(body) });

async function main() {
  await new Promise<void>((r) => fake.listen(TG_PORT, r));
  const server = spawn("npx", ["tsx", "src/index.ts"], {
    env: { ...process.env, PORT: String(API_PORT), TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_GROUP_ID: GROUP, TELEGRAM_COACH_USER_ID: COACH,
      TELEGRAM_API_BASE: `http://localhost:${TG_PORT}`, COACH_REPLY_TIMEOUT_SECONDS: "3", ANTHROPIC_API_KEY: "", DATA_DIR: `/tmp/jk-test-${Date.now()}`, ALLOWED_ORIGINS: "http://localhost:5173" },
    stdio: ["ignore", "inherit", "inherit"],
  });
  try {
    for (let i = 0; i < 40; i++) { try { if ((await api("/api/health")).ok) break; } catch {} await sleep(250); }

    // ---- contact form -> ONE "Potential Clients" topic
    const contact = (extra: object = {}) => post("/api/contact", { firstName: "Grace", lastName: "Hopper", email: "grace@example.com", phone: "", message: "Interested in Adults classes", website: "", ...extra });
    check("contact: invalid email rejected", (await contact({ email: "nope" })).status === 400);
    check("contact: accepted", (await contact()).status === 200);
    check("contact: second message accepted", (await contact({ message: "Second question" })).status === 200);
    check("contact: honeypot message sends nothing", (await contact({ website: "http://spam", message: "SPAM" })).status === 200 && !sent.some((s) => s.text?.includes("SPAM")));
    await sleep(200);
    const clientTopics = sent.filter((s) => s.method === "createForumTopic" && s.name === "Potential Clients");
    check("contact: exactly one 'Potential Clients' topic created", clientTopics.length === 1, String(clientTopics.length));
    const contactMsgs = sent.filter((s) => s.method === "sendMessage" && s.text?.includes("New contact form message"));
    check("contact: both messages go to that topic (thread 5)", contactMsgs.length === 2 && contactMsgs.every((m) => m.message_thread_id === 5));
    check("contact: shows 'Last, First' and date/time", /Hopper, Grace · [A-Z][a-z]{2} \d{1,2}, \d{4}, \d{1,2}:\d{2} (AM|PM) ET/.test(contactMsgs[0].text), contactMsgs[0].text);

    check("bad topic rejected", (await post("/api/chat/start", { topic: "Hack" })).status === 400);
    const start = await (await post("/api/chat/start", { topic: "Juniors (Ages 7-12)" })).json() as any;
    const { sessionId: id, token } = start;
    check("greeting mentions clicked button", start.snapshot.messages[0].text.startsWith("Hello. I see you are trying to register for Juniors (Ages 7-12)."), start.snapshot.messages[0].text);
    check("bad token rejected", (await post(`/api/chat/${id}/messages`, { text: "hi" }, "nope")).status === 401);

    // SSE stream
    let latest: any = null;
    const ctl = new AbortController();
    const sse = await api(`/api/chat/${id}/events?token=${token}`, { signal: ctl.signal });
    (async () => {
      const reader = sse.body!.getReader(); const dec = new TextDecoder(); let buf = "";
      try { for (;;) { const { value, done } = await reader.read(); if (done) break; buf += dec.decode(value);
        let i; while ((i = buf.indexOf("\n\n")) >= 0) { const chunk = buf.slice(0, i); buf = buf.slice(i + 2); if (chunk.startsWith("data: ")) latest = JSON.parse(chunk.slice(6)); } } } catch {}
    })();
    await sleep(300);
    check("SSE sends initial snapshot", latest?.messages?.length === 1);

    check("first message without name rejected", (await post(`/api/chat/${id}/messages`, { text: "hi" }, token)).status === 400);
    const r1 = await post(`/api/chat/${id}/messages`, { text: "I want to register my 8 year old son", firstName: "Ada", lastName: "Lovelace" }, token);
    check("first visitor message accepted", r1.status === 200);
    await sleep(500);
    check("'Connecting you with Coach' shown", latest.messages.some((m: any) => m.text.startsWith("Connecting you with Coach")));
    check("input locked (turn=coach)", latest.turn === "coach");
    check("second message blocked while waiting", (await post(`/api/chat/${id}/messages`, { text: "hello?" }, token)).status === 409);

    const chatTopic = sent.filter((s) => s.method === "createForumTopic").find((s) => s.name.includes("Lovelace"));
    check("chat topic is titled 'Last, First · button'", !!chatTopic && chatTopic.name === "Lovelace, Ada · Juniors (Ages 7-12)", JSON.stringify(chatTopic));
    const thread = 6;
    check("Telegram gets name + button", sent.some((s) => s.method === "sendMessage" && s.message_thread_id === thread && s.text.includes("Name: Lovelace, Ada") && s.text.includes("Button clicked: Juniors")));
    const firstMsg = sent.find((s) => s.method === "sendMessage" && s.message_thread_id === thread && s.text.endsWith("\nI want to register my 8 year old son"));
    check("visitor text is stamped 'Last, First · date time'", !!firstMsg && /^Lovelace, Ada · [A-Z][a-z]{2} \d{1,2}, \d{4}, \d{1,2}:\d{2} (AM|PM) ET\n/.test(firstMsg.text), firstMsg?.text);

    pushUpdate(thread, "999", "I am an impostor");
    await sleep(600);
    check("stranger's Telegram message ignored", !latest.messages.some((m: any) => m.from === "coach"));

    pushUpdate(thread, COACH, "Hi! Happy to help. What is his rating?");
    await sleep(600);
    check("coach reply reaches visitor", latest.messages.some((m: any) => m.from === "coach" && m.text.startsWith("Hi! Happy")), JSON.stringify(latest.messages));
    check("input unlocked after coach reply", latest.turn === "visitor");

    check("visitor can reply", (await post(`/api/chat/${id}/messages`, { text: "About 800" }, token)).status === 200);
    await sleep(300);
    check("visitor follow-up forwarded with name + time", sent.some((s) => s.text?.startsWith("Lovelace, Ada · ") && s.text.endsWith("\nAbout 800")));
    await sleep(3600);
    check("5-minute fallback fires (3s in test)", latest.fallback === true && latest.turn === "visitor" && latest.messages.some((m: any) => m.text.includes("Coach hasn't replied")));
    check("visitor can leave contact details", (await post(`/api/chat/${id}/messages`, { text: "call 555-1234" }, token)).status === 200);
    await sleep(300);
    check("contact details forwarded to Telegram", sent.some((s) => s.text?.includes("call 555-1234")));

    pushUpdate(thread, COACH, "/close");
    await sleep(600);
    check("/close ends chat", latest.status === "closed");
    check("closed chat rejects messages", (await post(`/api/chat/${id}/messages`, { text: "x" }, token)).status === 409);
    ctl.abort();
  } finally {
    server.kill(); fake.close(); setTimeout(() => process.exit(failures ? 1 : 0), 200);
  }
  console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
}
main();
