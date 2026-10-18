import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface RegisterChatValue {
  /** Which Register button was clicked, or null when the chat is closed. */
  topic: string | null;
  /** Changes on every click so a new chat starts even for the same button. */
  nonce: number;
  open: (topic: string) => void;
  close: () => void;
}

const RegisterChatContext = createContext<RegisterChatValue | null>(null);

export function RegisterChatProvider({ children }: { children: ReactNode }) {
  const [topic, setTopic] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const open = useCallback((t: string) => {
    setTopic(t);
    setNonce((n) => n + 1);
  }, []);
  const close = useCallback(() => setTopic(null), []);
  return (
    <RegisterChatContext.Provider value={{ topic, nonce, open, close }}>
      {children}
    </RegisterChatContext.Provider>
  );
}

export function useRegisterChat() {
  const ctx = useContext(RegisterChatContext);
  if (!ctx) throw new Error("useRegisterChat must be used within RegisterChatProvider");
  return ctx;
}
