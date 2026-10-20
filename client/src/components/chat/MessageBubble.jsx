import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate, initials, resolveAvatarUrl } from "../../utils/formatters";
import { profilePath } from "../../constants/ROUTES";
import NotificationActionModal from "../notifications/NotificationActionModal";

function SenderAvatar({ user, onClick }) {
  const cls = "w-6 h-6 rounded-full object-cover flex-shrink-0";
  if (user?.avatar_url) {
    return (
      <button onClick={onClick} className="flex-shrink-0">
        <img
          src={resolveAvatarUrl(user.avatar_url)}
          alt={user.username}
          className={cls}
        />
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0"
    >
      {initials(user?.first_name, user?.last_name)}
    </button>
  );
}

export default function MessageBubble({ message, isMine, sender }) {
  const navigate = useNavigate();
  const [showProfileChoice, setShowProfileChoice] = useState(false);

  if (message.is_system) {
    return (
      <div className="flex justify-center my-1">
        <span className="text-[11px] text-text-muted bg-border/40 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col ${isMine ? "items-end" : "items-start"} gap-0.5`}
    >
      {!isMine && sender && (
        <div className="flex items-center gap-1.5 px-1">
          <SenderAvatar
            user={sender}
            onClick={() => setShowProfileChoice(true)}
          />
          <span className="text-xs text-primary font-semibold">
            {sender.first_name} {sender.last_name}
          </span>
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
          ${
            isMine
              ? "bg-primary text-white rounded-br-sm"
              : "bg-surface border border-border text-text-primary rounded-bl-sm shadow-sm"
          }`}
      >
        {message.content}
      </div>
      <span className="text-[11px] text-text-muted px-1">
        {formatDate(message.created_at, "HH:mm")}
      </span>

      {!isMine && sender && (
        <NotificationActionModal
          open={showProfileChoice}
          onClose={() => setShowProfileChoice(false)}
          options={[
            {
              label: "Vezi profilul",
              onClick: () => {
                navigate(profilePath(sender.user_id));
                setShowProfileChoice(false);
              },
            },
          ]}
        />
      )}
    </div>
  );
}
