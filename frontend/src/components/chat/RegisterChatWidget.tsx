import { X } from "lucide-react";
import { useRegisterChat } from "@/context/RegisterChatContext";

/**
 * Placeholder for the live chat (built in the next phase). It already reads
 * which Register button was clicked and greets the visitor accordingly.
 */
export default function RegisterChatWidget() {
  const { topic, close } = useRegisterChat();
  if (!topic) return null;

  return (
    <div
      role="dialog"
      aria-label="Registration chat"
      className="fixed z-50 bottom-0 left-0 right-0 sm:bottom-4 sm:left-4 sm:right-auto sm:w-[420px] h-[70vh] sm:h-[560px] max-h-[calc(100dvh-1rem)] flex flex-col bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-blue-900 text-white rounded-t-2xl">
        <span className="font-semibold">Jumping Knights</span>
        <button onClick={close} aria-label="Close chat" className="p-1 hover:bg-blue-800 rounded">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-800 max-w-[85%]">
          Hello. I see you are trying to register for <strong>{topic}</strong>.
        </div>
      </div>
    </div>
  );
}
