import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Send, X } from "lucide-react";
import { useRegisterChat } from "@/context/RegisterChatContext";
import { closeChat, openEvents, sendMessage, startChat, type Msg, type Snapshot } from "@/lib/chatApi";

interface Conn { id: string; token: string }

export default function RegisterChatWidget() {
  const { topic, nonce, close } = useRegisterChat();
  const [conn, setConn] = useState<Conn | null>(null);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Start a fresh chat every time a Register button is clicked.
  useEffect(() => {
    if (!topic) return;
    let cancelled = false;
    let es: EventSource | null = null;
    let started: Conn | null = null;
    setConn(null); setSnap(null); setError(null); setText(""); setFirst(""); setLast("");

    startChat(topic)
      .then(({ sessionId, token, snapshot }) => {
        started = { id: sessionId, token };
        if (cancelled) { closeChat(sessionId, token); return; }
        setConn(started);
        setSnap(snapshot);
        es = openEvents(sessionId, token, (s) => setSnap((prev) => (!prev || s.rev >= prev.rev ? s : prev)));
      })
      .catch(() => { if (!cancelled) setError("We couldn't start the chat. Please try again in a moment, or use the contact form below."); });

    return () => {
      cancelled = true;
      es?.close();
      if (started) closeChat(started.id, started.token);
    };
  }, [topic, nonce]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [snap?.messages.length, snap?.turn]);

  if (!topic) return null;

  const canSend = !!conn && snap?.status === "open" && snap.turn === "visitor" && !sending;
  const waiting = snap?.status === "open" && snap.turn === "coach";
  // Name is asked once, before the first message, so the coach knows who is writing.
  const needsName = snap?.status === "open" && !snap.handedOff;
  const nameOk = !needsName || (first.trim() !== "" && last.trim() !== "");

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    const value = text.trim();
    if (!canSend || !value || !conn || !nameOk) return;
    setSending(true); setError(null);
    try {
      const { snapshot } = await sendMessage(conn.id, conn.token, value, needsName ? { firstName: first.trim(), lastName: last.trim() } : undefined);
      setSnap((prev) => (!prev || snapshot.rev >= prev.rev ? snapshot : prev));
      setText("");
    } catch (err) {
      setError((err as Error).message || "Message not sent.");
    } finally {
      setSending(false);
    }
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(); }
  }

  return (
    <div
      role="dialog"
      aria-label="Registration chat"
      className="fixed z-50 bottom-0 left-0 right-0 sm:bottom-4 sm:left-4 sm:right-auto sm:w-[440px] h-[85dvh] sm:h-[min(640px,calc(100dvh-2rem))] flex flex-col bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-blue-900 text-white">
        <div>
          <div className="font-semibold leading-tight">Jumping Knights</div>
          <div className="text-xs text-blue-200 leading-tight">Registration: {topic}</div>
        </div>
        <button onClick={close} aria-label="Close chat" className="p-1 hover:bg-blue-800 rounded">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" aria-live="polite">
        {!snap && !error && <p className="text-sm text-gray-500">Starting chat…</p>}
        {snap?.messages.map((m) => <Bubble key={m.id} m={m} />)}
        {waiting && (
          <div className="flex items-center gap-1 text-gray-400 pl-1" aria-label="Waiting for Coach">
            <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
          </div>
        )}
        {snap?.status === "closed" && <p className="text-center text-xs text-gray-500">This chat has ended.</p>}
        <div ref={endRef} />
      </div>

      {error && <p className="px-4 py-2 text-sm text-red-600 bg-red-50 border-t border-red-100">{error}</p>}

      <form onSubmit={submit} className="flex flex-col gap-2 p-3 border-t border-gray-200 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {needsName && (
          <div className="grid grid-cols-2 gap-2">
            <input
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              placeholder="First name"
              aria-label="First name"
              autoComplete="given-name"
              maxLength={60}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
            <input
              value={last}
              onChange={(e) => setLast(e.target.value)}
              placeholder="Last name"
              aria-label="Last name"
              autoComplete="family-name"
              maxLength={60}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
        )}
        <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          disabled={!canSend}
          maxLength={1000}
          rows={2}
          placeholder={waiting ? "Waiting for Coach to reply…" : snap?.status === "closed" ? "Chat ended" : "Type your message…"}
          className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-gray-100 disabled:text-gray-400"
        />
        <button
          type="submit"
          disabled={!canSend || !text.trim() || !nameOk}
          aria-label="Send message"
          className="h-10 w-10 shrink-0 rounded-lg bg-blue-900 text-white flex items-center justify-center hover:bg-blue-800 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
        </div>
      </form>
    </div>
  );
}

function Bubble({ m }: { m: Msg }) {
  if (m.from === "system") {
    return <p className="text-center text-xs italic text-gray-500">{m.text}</p>;
  }
  const mine = m.from === "visitor";
  const label = m.from === "coach" ? "Coach" : m.from === "claude" ? "Jumping Knights assistant" : null;
  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      {label && <span className="text-[11px] text-gray-500 mb-0.5 ml-1">{label}</span>}
      <div
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
          mine
            ? "bg-blue-900 text-white rounded-br-sm"
            : m.from === "coach"
              ? "bg-orange-100 text-gray-900 border border-orange-200 rounded-bl-sm"
              : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
        }`}
      >
        {m.text}
      </div>
    </div>
  );
}
