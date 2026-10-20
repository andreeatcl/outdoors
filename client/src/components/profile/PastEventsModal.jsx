import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Modal from "../ui/Modal";
import EventCard from "../events/EventCard";

const PAGE_SIZE = 10;

const FILTERS = [
  { key: "all", label: "Toate" },
  { key: "organizer", label: "Organizator" },
  { key: "participant", label: "Participant" },
];

export default function PastEventsModal({
  open,
  onClose,
  events,
  onEventClick,
  initialFilter = "all",
}) {
  const currentUser = useSelector((s) => s.auth.user);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState(initialFilter);

  useEffect(() => {
    if (open) {
      setPage(0);
      setFilter(initialFilter);
    }
  }, [open, initialFilter]);

  const filteredEvents = useMemo(() => {
    if (filter === "all") return events || [];
    return (events || []).filter((ev) => {
      const isOrganizer = ev.organizer?.user_id === currentUser?.user_id;
      return filter === "organizer" ? isOrganizer : !isOrganizer;
    });
  }, [events, filter, currentUser]);

  useEffect(() => {
    setPage(0);
  }, [filter]);

  const totalPages = Math.ceil((filteredEvents.length || 0) / PAGE_SIZE);
  const shown = filteredEvents.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Evenimente trecute (${events?.length || 0})`}
      size="lg"
    >
      <div className="p-4 flex flex-col gap-3">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                filter === f.key
                  ? "bg-primary text-white"
                  : "bg-background text-text-muted hover:bg-border/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {shown.length === 0 && (
          <p className="text-sm text-text-muted text-center py-6">
            Niciun eveniment de arătat.
          </p>
        )}

        {shown.map((ev) => (
          <EventCard key={ev.event_id} event={ev} onClick={onEventClick} />
        ))}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 mt-1 border-t border-border">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-xs font-semibold text-primary hover:underline px-2 disabled:opacity-30 disabled:hover:no-underline flex items-center gap-1"
            >
              <ArrowLeft size={12} /> Înapoi
            </button>
            <span className="text-xs text-text-muted">
              Pagina {page + 1} din {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="text-xs font-semibold text-primary hover:underline px-2 disabled:opacity-30 disabled:hover:no-underline flex items-center gap-1"
            >
              Înainte <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
