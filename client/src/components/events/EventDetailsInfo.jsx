import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { X, Calendar, Clock, Flag, Users, MapPin, Hand } from "lucide-react";
import FriendsModal from "../profile/FriendsModal";
import { leaveEvent } from "../../store/eventsSlice";
import { getEventColorLabel } from "../../utils/eventColors";
import {
  formatDate,
  formatDuration,
  eventEndTime,
  initials,
  resolveAvatarUrl,
} from "../../utils/formatters";
import { profilePath } from "../../constants/ROUTES";
import api from "../../services/api";

function Avatar({ user, size = 8 }) {
  const s = `w-${size} h-${size}`;
  if (user?.avatar_url) {
    return (
      <img
        src={resolveAvatarUrl(user.avatar_url)}
        alt={user.username}
        className={`${s} rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`${s} rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold`}
    >
      {initials(user?.first_name, user?.last_name)}
    </div>
  );
}

export function EventDetailsHeader({
  event,
  color,
  typeInfo,
  isAuth,
  showCountdown,
  countdownLabel,
  onClose,
}) {
  return (
    <div
      className="px-6 pt-6 pb-4 relative"
      style={{
        background: `linear-gradient(135deg, ${color}18 0%, transparent 60%)`,
      }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 text-text-muted"
      >
        <X size={18} />
      </button>

      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: color + "22", color }}
        >
          <typeInfo.icon size={24} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: color + "20", color }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: color }}
              />
              {event.status === "ongoing"
                ? "În desfășurare"
                : getEventColorLabel(event)}
            </span>
            {showCountdown && isAuth && (
              <span className="text-xs font-medium text-text-muted">
                {countdownLabel}
              </span>
            )}
          </div>
          <h2 className="font-display font-bold text-xl text-text-primary leading-tight">
            {event.title}
          </h2>
        </div>
      </div>
    </div>
  );
}

export default function EventDetailsInfo({
  event,
  color,
  fillPct,
  isAuth,
  isOrganizer,
  onClose,
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);

  const handleRemoveParticipant = async (userId) => {
    try {
      await api.delete(`/api/events/${event.event_id}/participants/${userId}`);
      dispatch(leaveEvent({ eventId: event.event_id, userId }));
      toast("Participant eliminat din eveniment.", {
        icon: <Hand size={18} />,
      });
    } catch (err) {
      toast.error(
        err.response?.data?.error ?? "Nu s-a putut elimina participantul.",
      );
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {(isAuth
          ? [
              {
                icon: Calendar,
                label: "Start",
                value: formatDate(event.start_date, "d MMM yyyy, HH:mm"),
              },
              {
                icon: Clock,
                label: "Durată",
                value: formatDuration(event.duration),
              },
              {
                icon: Flag,
                label: "Sfârșit",
                value: eventEndTime(event.start_date, event.duration),
              },
              {
                icon: Users,
                label: "Locuri",
                value: `${event.participants_count}/${event.max_participants}`,
              },
            ]
          : [
              {
                icon: Clock,
                label: "Durată",
                value: formatDuration(event.duration),
              },
              {
                icon: Users,
                label: "Locuri",
                value: `${event.participants_count}/${event.max_participants}`,
              },
            ]
        ).map((item) => (
          <div key={item.label} className="bg-background rounded-xl p-3">
            <p className="text-xs text-text-muted flex items-center gap-1">
              <item.icon size={12} /> {item.label}
            </p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span>Participanți</span>
          <span>{fillPct}% ocupat</span>
        </div>
        <div className="w-full bg-border rounded-full h-2">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${fillPct}%`, background: color }}
          />
        </div>
      </div>

      <div className="flex items-start gap-2">
        <MapPin size={18} className="mt-0.5 text-text-muted" />
        <div>
          <p className="text-sm font-medium text-text-primary">
            {event.address}
          </p>
          {event.coordinates && (
            <p className="text-xs text-text-muted">
              {event.coordinates.lat.toFixed(5)},{" "}
              {event.coordinates.lng.toFixed(5)}
            </p>
          )}
        </div>
      </div>

      {event.description && (
        <p className="text-sm text-text-muted bg-background rounded-xl p-3 leading-relaxed">
          {event.description}
        </p>
      )}

      {event.organizer && (
        <div className="flex items-center gap-3">
          <Avatar user={event.organizer} size={9} />
          <div>
            <p className="text-xs text-text-muted">Organizator</p>
            <button
              className="text-sm font-semibold text-primary hover:underline"
              onClick={() => {
                navigate(profilePath(event.organizer.user_id));
                onClose();
              }}
            >
              {event.organizer.first_name} {event.organizer.last_name}
            </button>
          </div>
        </div>
      )}

      {event.participants?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
              Participanți
            </p>
            {isAuth && (
              <button
                onClick={() => setShowParticipantsModal(true)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Vezi lista
              </button>
            )}
          </div>
          <div className="flex -space-x-1">
            {event.participants.slice(0, 8).map((p, i, arr) => (
              <div
                key={p.user_id}
                title={`${p.first_name} ${p.last_name}`}
                className="ring-2 ring-surface rounded-full"
                style={{ zIndex: arr.length - i }}
              >
                <Avatar user={p} size={8} />
              </div>
            ))}
            {event.participants_count >
              event.participants.slice(0, 8).length && (
              <div className="w-8 h-8 rounded-full bg-border ring-2 ring-surface flex items-center justify-center text-xs text-text-muted font-semibold">
                +
                {event.participants_count -
                  event.participants.slice(0, 8).length}
              </div>
            )}
          </div>
          {isAuth && (
            <FriendsModal
              open={showParticipantsModal}
              onClose={() => setShowParticipantsModal(false)}
              friends={event.participants}
              title="Participanți"
              isOrganizer={isOrganizer}
              organizerId={event.organizer?.user_id}
              onRemove={handleRemoveParticipant}
            />
          )}
        </div>
      )}
    </>
  );
}
