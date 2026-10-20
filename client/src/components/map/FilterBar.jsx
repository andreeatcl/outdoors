import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search, ChevronUp, ChevronDown, X } from "lucide-react";
import { setFilters } from "../../store/eventsSlice";
import { EVENT_TYPES } from "../../constants/EVENT_TYPES";

const ALL_TYPES = EVENT_TYPES.map((t) => t.value);

const TIME_FILTERS = [
  { value: null, label: "Toate" },
  { value: "1", label: "<1h" },
  { value: "3", label: "<3h" },
  { value: "6", label: "<6h" },
  { value: "24", label: "<24h" },
];

const DISTANCE_FILTERS = [
  { value: null, label: "Toate" },
  { value: 1, label: "<1 km" },
  { value: 3, label: "<3 km" },
  { value: 5, label: "<5 km" },
  { value: 10, label: "<10 km" },
];

export default function FilterBar({ hasBanner = true }) {
  const dispatch = useDispatch();
  const { filters } = useSelector((s) => s.events);
  const [open, setOpen] = useState(false);

  const toggleType = (value) => {
    const types = filters.types.includes(value)
      ? filters.types.filter((t) => t !== value)
      : [...filters.types, value];
    dispatch(setFilters({ types }));
  };

  return (
    <div
      className="map-overlay top-[60px] left-3 flex flex-col gap-2"
      style={{ maxWidth: 260 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-surface/90 backdrop-blur-sm rounded-xl shadow-float border border-border/60 text-sm font-medium text-text-primary hover:bg-surface transition-colors"
      >
        <Search size={16} />
        <span>Filtre</span>
        {(filters.types.length < ALL_TYPES.length ||
          filters.timeRange ||
          filters.distanceKm) && (
          <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-auto">
            {ALL_TYPES.length -
              filters.types.length +
              (filters.timeRange ? 1 : 0) +
              (filters.distanceKm ? 1 : 0)}
          </span>
        )}
        <span className="ml-auto text-text-muted">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {open && (
        <div className="bg-surface/95 backdrop-blur-sm rounded-2xl shadow-float border border-border/60 p-3 flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
              Activitate
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => toggleType(t.value)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors
                    ${
                      filters.types.includes(t.value)
                        ? "bg-primary text-white"
                        : "bg-background text-text-primary hover:bg-primary-light"
                    }`}
                >
                  <t.icon size={14} />
                  <span>{t.label}</span>
                </button>
              ))}
              {filters.types.length > 0 && (
                <button
                  onClick={() => dispatch(setFilters({ types: [] }))}
                  title="Deselectează toate activitățile"
                  className="p-1 rounded-lg text-text-muted hover:text-primary hover:bg-primary-light transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
              Timp rămas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TIME_FILTERS.map((t) => (
                <button
                  key={t.label}
                  onClick={() => dispatch(setFilters({ timeRange: t.value }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
                    ${
                      filters.timeRange === t.value
                        ? "bg-primary text-white"
                        : "bg-background text-text-primary hover:bg-primary-light"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
              Distanță
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DISTANCE_FILTERS.map((t) => (
                <button
                  key={t.label}
                  onClick={() => dispatch(setFilters({ distanceKm: t.value }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
                    ${
                      filters.distanceKm === t.value
                        ? "bg-primary text-white"
                        : "bg-background text-text-primary hover:bg-primary-light"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {(filters.types.length < ALL_TYPES.length ||
            filters.timeRange ||
            filters.distanceKm) && (
            <button
              onClick={() =>
                dispatch(
                  setFilters({
                    types: ALL_TYPES,
                    timeRange: null,
                    distanceKm: null,
                  }),
                )
              }
              className="text-xs text-text-muted hover:text-primary transition-colors self-start flex items-center gap-1"
            >
              <X size={12} /> Resetează filtrele
            </button>
          )}
        </div>
      )}
    </div>
  );
}
