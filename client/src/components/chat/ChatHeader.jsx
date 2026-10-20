import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Users, Calendar, Clock, AlertTriangle } from "lucide-react";
import { updateConversationStatus } from "../../store/chatSlice";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import api from "../../services/api";
import { formatDate, formatDuration } from "../../utils/formatters";
import { profilePath } from "../../constants/ROUTES";

export default function ChatHeader({
  conv,
  activeConversation,
  isGroup,
  isFinished,
  isFormerParticipant,
  isChatLeft,
  onEventClick,
  onError,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [leavingChat, setLeavingChat] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const title =
    conv?.type === "dm"
      ? `${conv.with?.first_name ?? ""} ${conv.with?.last_name ?? ""}`.trim()
      : (conv?.event?.title ?? "");

  const handleLeaveChat = async () => {
    if (!conv?.event?.event_id || leavingChat) return;
    setLeavingChat(true);
    try {
      await api.delete(`/api/events/${conv.event.event_id}/leave-chat`);
      dispatch(
        updateConversationStatus({
          convId: activeConversation,
          updates: { isChatLeft: true },
        }),
      );
      setShowLeaveConfirm(false);
    } catch {
      onError("Nu am putut părăsi conversația.");
    } finally {
      setLeavingChat(false);
    }
  };

  return (
    <>
      <div className="px-5 py-3 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg flex-shrink-0">
          {isGroup ? (
            <Users size={18} />
          ) : (
            conv?.with?.first_name?.[0]?.toUpperCase()
          )}
        </div>

        {isGroup ? (
          <button
            className="flex-1 min-w-0 text-left hover:opacity-70 transition-opacity"
            onClick={() =>
              conv.event?.event_id && onEventClick?.(conv.event.event_id)
            }
          >
            <p className="font-semibold text-text-primary text-sm truncate">
              {title}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
              {conv.event.participants_count != null && (
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Users size={11} /> {conv.event.participants_count}{" "}
                  {conv.event.participants_count === 1
                    ? "participant"
                    : "participanți"}
                </span>
              )}
              {conv.event.start_date && (
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Calendar size={11} />{" "}
                  {formatDate(conv.event.start_date, "d MMM, HH:mm")}
                </span>
              )}
              {conv.event.duration && (
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Clock size={11} /> {formatDuration(conv.event.duration)}
                </span>
              )}
            </div>
          </button>
        ) : (
          <button
            className="flex-1 min-w-0 text-left hover:opacity-70 transition-opacity"
            onClick={() =>
              conv?.with?.user_id && navigate(profilePath(conv.with.user_id))
            }
          >
            <p className="font-semibold text-text-primary text-sm truncate">
              {title}
            </p>
            <p className="text-xs text-text-muted">@{conv?.with?.username}</p>
          </button>
        )}

        {isFinished && (
          <span className="flex-shrink-0 px-2.5 py-1 bg-border/50 rounded-full text-xs text-text-muted font-medium">
            Finalizat
          </span>
        )}

        {isGroup && !isFormerParticipant && !isChatLeft && (
          <button
            onClick={() => setShowLeaveConfirm(true)}
            disabled={leavingChat}
            className="ml-auto flex-shrink-0 px-2.5 py-1 rounded-full text-xs text-red-600 hover:bg-red-50 transition-colors font-medium disabled:opacity-50"
          >
            Ieși din conversație
          </button>
        )}
      </div>

      <Modal
        open={showLeaveConfirm}
        onClose={() => !leavingChat && setShowLeaveConfirm(false)}
        size="sm"
      >
        <div className="p-5 flex flex-col gap-4 text-center">
          <AlertTriangle size={32} className="mx-auto text-red-500" />
          <p className="text-sm text-text-primary">
            Sigur vrei să ieși din această conversație?
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowLeaveConfirm(false)}
              disabled={leavingChat}
            >
              Anulează
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleLeaveChat}
              disabled={leavingChat}
            >
              Ieși
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
