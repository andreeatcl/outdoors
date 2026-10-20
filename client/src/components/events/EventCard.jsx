import { Calendar, Clock, Crown } from "lucide-react";
import { useSelector } from "react-redux";
import { getEventColor, getEventColorLabel } from "../../utils/eventColors";
import { getEventType } from "../../constants/EVENT_TYPES";
import {
  timeFromNow,
  formatDate,
  formatDuration,
} from "../../utils/formatters";

export default function EventCard({ event, onClick, compact = false }) {
  const currentUser = useSelector((s) => s.auth.user);
  const isAuth = useSelector((s) => s.auth.isLoggedIn && !s.auth.isGuest);
  const color = getEventColor(event);
  const typeInfo = getEventType(event.event_type);
  const fillPct = Math.round(
    (event.participants_count / event.max_participants) * 100,
  );
  const isOrganizer =
    currentUser && event.organizer?.user_id === currentUser.user_id;

  return (
    <div
      onClick={() => onClick?.(event)}
      className="bg-surface rounded-2xl border border-border/60 p-4 hover:shadow-card transition-all cursor-pointer hover:-translate-y-0.5 active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: color + "18", color }}
        >
          <typeInfo.icon size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-text-primary text-sm leading-tight line-clamp-1 flex items-center gap-1.5">
              {event.title}
              {isOrganizer && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                  <Crown size={10} /> Organizator
                </span>
              )}
            </h3>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: color + "20", color }}
            >
              {event.status === "ongoing"
                ? "Live"
                : isAuth
                  ? timeFromNow(event.start_date)
                  : getEventColorLabel(event)}
            </span>
          </div>

          <p className="text-xs text-text-muted mt-1 line-clamp-1">
            {event.address}
          </p>

          {!compact && (
            <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
              {isAuth && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} />{" "}
                  {formatDate(event.start_date, "d MMM, HH:mm")}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={12} /> {formatDuration(event.duration)}
              </span>
            </div>
          )}

          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex-1 bg-border rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${fillPct}%`, background: color }}
              />
            </div>
            <span className="text-xs text-text-muted flex-shrink-0">
              {event.participants_count}/{event.max_participants}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
