export function hourLabel(h: number) {
  const hh = ((h % 24) + 24) % 24;
  const suffix = hh < 12 ? "AM" : "PM";
  const n = hh % 12 === 0 ? 12 : hh % 12;
  return n + " " + suffix;
}

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function localDate(d = new Date()) {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

export function monthKey(d: Date) {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1);
}

export function formatCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  if (m >= 60) return Math.floor(m / 60) + "h " + pad(m % 60) + "m";
  return m + ":" + pad(s % 60);
}

export function timeOf(ts: number) {
  const d = new Date(ts);
  const h = d.getHours();
  return (h % 12 === 0 ? 12 : h % 12) + ":" + pad(d.getMinutes()) + (h < 12 ? " AM" : " PM");
}

export type DayLike = { startAt: number; slotMs: number; hourCount: number; status: string };

export function dayClock(day: DayLike, now: number) {
  const idx = Math.floor((now - day.startAt) / day.slotMs);
  const ended = day.status === "done" || idx >= day.hourCount;
  const notStarted = idx < 0;
  const current = Math.min(Math.max(idx, 0), day.hourCount - 1);
  const nextAt = notStarted ? day.startAt : day.startAt + (current + 1) * day.slotMs;
  return { current, ended, notStarted, msLeft: nextAt - now };
}
