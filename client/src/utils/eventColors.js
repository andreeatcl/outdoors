export const EVENT_COLORS = {
  far: "#3B82F6",
  day: "#06B6D4",
  h6: "#EAB308",
  h3: "#F97316",
  h1: "#EF4444",
  soon: "#B91C1C",
  ongoing: "#A855F7",
  finished: "#78716C",
};

export function getEventColor(event) {
  if (event.status === "ongoing") return EVENT_COLORS.ongoing;
  if (event.status === "finished") return EVENT_COLORS.finished;

  const now = Date.now();
  const start = new Date(event.start_date).getTime();
  const diff = start - now;
  const hours = diff / (1000 * 60 * 60);

  if (hours > 24) return EVENT_COLORS.far;
  if (hours > 12) return EVENT_COLORS.day;
  if (hours > 6) return EVENT_COLORS.h6;
  if (hours > 3) return EVENT_COLORS.h3;
  if (hours > 1) return EVENT_COLORS.h1;
  return EVENT_COLORS.soon;
}

export function lightenColor(hex, amount = 0.82) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);
  return `rgb(${nr}, ${ng}, ${nb})`;
}

export function getEventColorLabel(event) {
  const color = getEventColor(event);
  const map = {
    [EVENT_COLORS.far]: ">24h",
    [EVENT_COLORS.day]: "<24h",
    [EVENT_COLORS.h6]: "<12h",
    [EVENT_COLORS.h3]: "<6h",
    [EVENT_COLORS.h1]: "<3h",
    [EVENT_COLORS.soon]: "<1h",
    [EVENT_COLORS.ongoing]: "În desfășurare",
    [EVENT_COLORS.finished]: "Terminat",
  };
  return map[color] ?? "";
}
