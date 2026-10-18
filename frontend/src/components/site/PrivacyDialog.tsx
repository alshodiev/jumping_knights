import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { SITE } from "@/config";

export default function PrivacyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      aria-labelledby="privacy-title"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl p-0 shadow-2xl backdrop:bg-black/50"
    >
      <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto text-gray-700 text-sm leading-relaxed">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 id="privacy-title" className="text-xl font-bold text-blue-900">Privacy Policy</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 -m-1 text-gray-500 hover:text-gray-900"><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-3"><strong>What we collect.</strong> Only what you type into the contact form or the registration chat: your name, email, phone number, your message, and which program you asked about.</p>
        <p className="mb-3"><strong>How we use it.</strong> To answer your question and arrange lessons. Messages from the contact form and the chat are delivered to the academy's coach through Telegram. The chat's opening question is written by an AI assistant (Claude, by Anthropic), which sees the program you chose and may see your first message to summarize it for the coach.</p>
        <p className="mb-3"><strong>What not to send.</strong> Please don't share payment card details or other sensitive information in the form or the chat.</p>
        <p className="mb-3"><strong>Children.</strong> If you're registering a child, please enter the details yourself as their parent or guardian.</p>
        <p className="mb-3"><strong>Sharing.</strong> We don't sell your information. Chats are kept for up to 24 hours on our server.</p>
        <p><strong>Questions or deletion requests.</strong> Email <a className="underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
      </div>
    </dialog>
  );
}
