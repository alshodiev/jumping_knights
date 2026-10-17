import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface RegisterChatValue {
  /** Which Register button the visitor clicked, or null when the chat is closed. */
  topic: string | null;
  open: (topic: string) => void;
  close: () => void;
}

const RegisterChatContext = createContext<RegisterChatValue | null>(null);

export function RegisterChatProvider({ children }: { children: ReactNode }) {
  const [topic, setTopic] = useState<string | null>(null);
  const open = useCallback((t: string) => setTopic(t), []);
  const close = useCallback(() => setTopic(null), []);
  return (
    <RegisterChatContext.Provider value={{ topic, open, close }}>
      {children}
    </RegisterChatContext.Provider>
  );
}

export function useRegisterChat() {
  const ctx = useContext(RegisterChatContext);
  if (!ctx) throw new Error("useRegisterChat must be used within RegisterChatProvider");
  return ctx;
}
