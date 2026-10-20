import { format, addMinutes } from "date-fns";
import { ro } from "date-fns/locale";

export function timeFromNow(dateStr) {
  try {
    const diffMs = Math.abs(Date.now() - new Date(dateStr).getTime());
    const m = Math.floor(diffMs / 60000);
    if (m < 1) return "acum";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}z`;
    const w = Math.floor(d / 7);
    if (w < 5) return `${w}w`;
    return format(new Date(dateStr), "d MMM", { locale: ro });
  } catch {
    return "";
  }
}

export function formatDate(dateStr, fmt = "d MMM yyyy, HH:mm") {
  try {
    return format(new Date(dateStr), fmt, { locale: ro });
  } catch {
    return "";
  }
}

export function eventEndTime(startDate, durationMinutes) {
  try {
    return format(addMinutes(new Date(startDate), durationMinutes), "HH:mm", {
      locale: ro,
    });
  } catch {
    return "";
  }
}

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function truncate(str, n = 50) {
  if (!str) return "";
  return str.length > n ? str.slice(0, n) + "…" : str;
}

export function initials(firstName, lastName) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

export function formatNotificationContent(content) {
  if (!content) return "";
  const idx = content.indexOf("::");
  return idx === -1 ? content : content.slice(idx + 2);
}

export function resolveAvatarUrl(avatarUrl) {
  if (!avatarUrl) return null;
  if (/^https?:\/\//i.test(avatarUrl) || avatarUrl.startsWith("blob:")) {
    return avatarUrl;
  }
  const base = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
  return `${base}${avatarUrl}`;
}
