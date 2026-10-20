import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Tag,
  Sparkles,
  Check,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { EVENT_TYPES, getEventType } from "../constants/EVENT_TYPES";
import { getEventColor } from "../utils/eventColors";
import { timeFromNow, formatDate, formatDuration } from "../utils/formatters";
import { setSelected } from "../store/eventsSlice";
import EventDetailsModal from "../components/events/EventDetailsModal";
import api from "../services/api";

const TIME_OPTIONS = [
  { value: null, label: "Toate" },
  { value: 7, label: "Săptămâna asta" },
  { value: 30, label: "Luna asta" },
  { value: 90, label: "Ultimele 3 luni" },
  { value: 365, label: "Ultimul an" },
];

const SORT_OPTIONS = [
  { value: "date_desc", label: "Dată (recent)" },
  { value: "date_asc", label: "Dată (vechi)" },
  { value: "participants_desc", label: "Participanți ↓" },
  { value: "participants_asc", label: "Participanți ↑" },
];

function EventCard({ event, onClick }) {
  const color = getEventColor(event);
  const typeInfo = getEventType(event.event_type);
  const fillPct = Math.round(
    (event.participants_count / event.max_participants) * 100,
  );
  const currentUser = useSelector((s) => s.auth.user);
  const isCreated = event.organizer?.user_id === currentUser?.user_id;

  return (
    <div
      onClick={onClick}
      className="bg-surface rounded-2xl border border-border/60 p-4 hover:shadow-card transition-all hover:-translate-y-0.5 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: color + "18", color }}
        >
          <typeInfo.icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-text-primary text-sm leading-tight line-clamp-1">
              {event.title}
            </h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isCreated && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Creat
                </span>
              )}
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: color + "20", color }}
              >
                {event.status === "ongoing"
                  ? "Live"
                  : event.status === "finished"
                    ? "Încheiat"
                    : timeFromNow(event.start_date)}
              </span>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-1 line-clamp-1">
            {event.address}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar size={12} />{" "}
              {formatDate(event.start_date, "d MMM yyyy, HH:mm")}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {formatDuration(event.duration)}
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex-1 bg-border rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${fillPct}%`, background: color }}
              />
            </div>
            <span className="text-xs text-text-muted flex-shrink-0">
              {event.participants_count}/{event.max_participants} participanți
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypeDropdown({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const allSelected = selected.length === 0;

  const toggle = (value) => {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
    else onChange([...selected, value]);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-xl text-sm text-text-primary hover:bg-background transition-colors"
      >
        <Tag size={16} />
        <span>
          {allSelected
            ? "Tip activitate"
            : `${selected.length} tip${selected.length > 1 ? "uri" : ""}`}
        </span>
        <span className="text-text-muted">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-20 bg-surface border border-border rounded-2xl shadow-float p-2 min-w-[180px] max-h-64 overflow-y-auto">
            <button
              onClick={() => {
                onChange([]);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors text-left ${allSelected ? "bg-primary/10 text-primary font-semibold" : "hover:bg-background text-text-primary"}`}
            >
              <Sparkles size={16} /> Toate tipurile
            </button>
            {EVENT_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => toggle(t.value)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors text-left ${selected.includes(t.value) ? "bg-primary/10 text-primary font-semibold" : "hover:bg-background text-text-primary"}`}
              >
                <t.icon size={16} />
                <span className="flex-1">{t.label}</span>
                {selected.includes(t.value) && (
                  <Check size={14} className="text-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function MyEventsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((s) => s.auth.user);
  const [tab, setTab] = useState("all");
  const [types, setTypes] = useState([]);
  const [timeDays, setTimeDays] = useState(null);
  const [sort, setSort] = useState("date_desc");
  const [allMyEvents, setAllMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    api
      .get("/api/events/my")
      .then(({ data }) => {
        const seen = new Set();
        const combined = [
          ...(data.organized ?? []),
          ...(data.joined ?? []),
        ].filter((e) => {
          if (seen.has(e.event_id)) return false;
          seen.add(e.event_id);
          return true;
        });
        setAllMyEvents(combined);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = allMyEvents;
    if (tab === "participated")
      result = result.filter(
        (e) => e.organizer?.user_id !== currentUser?.user_id,
      );
    else if (tab === "created")
      result = result.filter(
        (e) => e.organizer?.user_id === currentUser?.user_id,
      );
    if (types.length > 0)
      result = result.filter((e) => types.includes(e.event_type));
    if (timeDays) {
      const cutoff = Date.now() - timeDays * 24 * 60 * 60 * 1000;
      result = result.filter((e) => new Date(e.start_date).getTime() >= cutoff);
    }
    return [...result].sort((a, b) => {
      if (sort === "participants_desc")
        return b.participants_count - a.participants_count;
      if (sort === "participants_asc")
        return a.participants_count - b.participants_count;
      if (sort === "date_asc")
        return new Date(a.start_date) - new Date(b.start_date);
      return new Date(b.start_date) - new Date(a.start_date);
    });
  }, [allMyEvents, tab, types, timeDays, sort, currentUser]);

  const tabs = [
    { value: "all", label: "Toate", count: allMyEvents.length },
    {
      value: "participated",
      label: "Participant",
      count: allMyEvents.filter(
        (e) => e.organizer?.user_id !== currentUser?.user_id,
      ).length,
    },
    {
      value: "created",
      label: "Organizator",
      count: allMyEvents.filter(
        (e) => e.organizer?.user_id === currentUser?.user_id,
      ).length,
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface shadow-sm flex-shrink-0">
        <button
          onClick={() => navigate("/home")}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-background text-text-muted transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <img src="/favicon.svg" alt="Outdoors" className="w-7 h-7" />
        <span className="font-display font-bold text-text-primary">
          Evenimentele mele
        </span>
      </div>

      <div className="flex border-b border-border bg-surface flex-shrink-0 px-4">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.value ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-primary"}`}
          >
            {t.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === t.value ? "bg-primary/10 text-primary" : "bg-border text-text-muted"}`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div className="px-4 py-3 flex items-center gap-2 flex-wrap bg-surface border-b border-border/50 flex-shrink-0">
        <TypeDropdown selected={types} onChange={setTypes} />
        <select
          value={timeDays ?? ""}
          onChange={(e) =>
            setTimeDays(e.target.value ? Number(e.target.value) : null)
          }
          className="px-3 py-2 bg-surface border border-border rounded-xl text-sm text-text-primary hover:bg-background transition-colors cursor-pointer outline-none appearance-none pr-8"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2378716c' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
          }}
        >
          {TIME_OPTIONS.map((o) => (
            <option key={String(o.value)} value={o.value ?? ""}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 bg-surface border border-border rounded-xl text-sm text-text-primary hover:bg-background transition-colors cursor-pointer outline-none appearance-none pr-8"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2378716c' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
          }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-text-muted text-sm">
            Se încarcă…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-text-muted">
            <Calendar size={48} />
            <p className="text-sm font-medium">Niciun eveniment găsit</p>
            <p className="text-xs">Încearcă să schimbi filtrele</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((ev) => (
              <EventCard
                key={ev.event_id}
                event={ev}
                onClick={() => {
                  dispatch(setSelected(ev));
                  setDetailsOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <EventDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  );
}
