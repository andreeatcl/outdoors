import { useState } from "react";
import { Send } from "lucide-react";
import { sendSocketMessage } from "../../services/socket";

export default function ChatInput({
  conv,
  activeConversation,
  isFormerParticipant,
  isChatLeft,
  isFormerFriend,
}) {
  const [text, setText] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const opts =
      conv?.type === "dm"
        ? { receiverId: conv.with?.user_id }
        : { eventId: conv?.event?.event_id };
    sendSocketMessage(activeConversation, text.trim(), opts);
    setText("");
  };

  return (
    <>
      {isFormerParticipant ? (
        <div className="px-5 py-3 border-t border-border text-center text-xs text-text-muted bg-background">
          Nu mai ești participant la acest eveniment.
        </div>
      ) : isChatLeft ? (
        <div className="px-5 py-3 border-t border-border text-center text-xs text-text-muted bg-background">
          Ai părăsit această conversație.
        </div>
      ) : isFormerFriend ? (
        <div className="px-5 py-3 border-t border-border text-center text-xs text-text-muted bg-background">
          Nu mai ești prieten cu această persoană.
        </div>
      ) : (
        <form
          onSubmit={handleSend}
          className="px-4 py-3 border-t border-border flex gap-3 items-end"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Scrie un mesaj…"
            className="flex-1 px-4 py-2.5 rounded-2xl border border-border bg-background text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) handleSend(e);
            }}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
      )}
    </>
  );
}
