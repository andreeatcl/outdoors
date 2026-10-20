import { useNavigate } from "react-router-dom";
import { Menu, ArrowRight } from "lucide-react";
import { getEventColor } from "../../utils/eventColors";
import { getEventType } from "../../constants/EVENT_TYPES";

export default function TopBar({
  ongoingEvents,
  onEventClick,
  onSeeMore,
  onMenuOpen,
}) {
  const navigate = useNavigate();
  return (
    <div
      className="map-overlay top-0 left-0 right-0 h-14 bg-surface/90 backdrop-blur-sm border-b border-border/50 flex items-center px-3 gap-3"
      style={{ zIndex: 990 }}
    >
      <button
        onClick={() => navigate("/home")}
        className="flex-shrink-0 focus:outline-none"
      >
        <img src="/outdoors-logo.svg" alt="Outdoors" className="h-7 w-auto" />
      </button>

      {ongoingEvents.length > 0 && (
        <div className="hidden md:flex flex-1 items-center gap-2 overflow-hidden">
          <span className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest flex-shrink-0">
            <span className="w-2 h-2 bg-primary rounded-full" />
            Live
          </span>
          {ongoingEvents.slice(0, 3).map((ev) => {
            const color = getEventColor(ev);
            const typeInfo = getEventType(ev.event_type);
            return (
              <button
                key={ev.event_id}
                onClick={() => onEventClick(ev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors hover:opacity-80 flex-shrink-0"
                style={{ background: color + "18", color }}
              >
                <typeInfo.icon size={14} />
                <span className="max-w-[140px] truncate">{ev.title}</span>
                <span className="opacity-70">
                  · {ev.participants_count}/{ev.max_participants}
                </span>
              </button>
            );
          })}
          {ongoingEvents.length > 3 && (
            <button
              onClick={onSeeMore}
              className="text-xs font-semibold text-primary hover:underline flex-shrink-0 flex items-center gap-1"
            >
              +{ongoingEvents.length - 3} mai multe <ArrowRight size={12} />
            </button>
          )}
        </div>
      )}

      <div className="flex-1" />

      <button
        onClick={onMenuOpen}
        className="w-9 h-9 bg-background rounded-xl border border-border/60 flex items-center justify-center text-text-primary hover:bg-border/30 transition-colors flex-shrink-0"
      >
        <Menu size={18} />
      </button>
    </div>
  );
}
