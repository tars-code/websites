import type { Weekday } from "@/lib/types";

export const WEEKDAYS: Weekday[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];


/** Current date/time parts in the given IANA timezone. */
export function nowInZone(timeZone: string, now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: parts.weekday as Weekday,
    time: `${parts.hour}:${parts.minute}`,
  };
}

export function todayInZone(timeZone: string) {
  return nowInZone(timeZone).date;
}

/** Add days to a YYYY-MM-DD string (calendar arithmetic, timezone-free). */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000,
  );
}

/**
 * Next occurrence of the weekly meeting. If today is meeting day and the
 * meeting hasn't ended yet, returns today.
 */
export function nextWeeklyDate(
  timeZone: string,
  day: Weekday,
  endTime: string,
  now = new Date(),
): string {
  const n = nowInZone(timeZone, now);
  const diff = (WEEKDAYS.indexOf(day) - WEEKDAYS.indexOf(n.weekday) + 7) % 7;
  const ahead = diff === 0 && n.time >= (endTime || "23:59") ? 7 : diff;
  return addDays(n.date, ahead);
}

/** Most recent meeting day on or before today — default for new meetups. */
export function lastWeeklyDate(timeZone: string, day: Weekday, now = new Date()): string {
  const n = nowInZone(timeZone, now);
  const diff = (WEEKDAYS.indexOf(n.weekday) - WEEKDAYS.indexOf(day) + 7) % 7;
  return addDays(n.date, -diff);
}

/*
 * Display formatting is done by hand (not Intl) so server and browser always
 * produce identical strings — Intl output differs between ICU versions and
 * would cause hydration mismatches.
 */
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parts(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, weekday: WEEKDAYS[dow], month: MONTHS[m - 1] };
}

/** "Friday, 26 September 2026" */
export function formatDateLong(date: string, withYear = true) {
  if (!date) return "";
  const p = parts(date);
  return `${p.weekday}, ${p.d} ${p.month}${withYear ? ` ${p.y}` : ""}`;
}

/** "26 Sep 2026" */
export function formatDateShort(date: string) {
  if (!date) return "";
  const p = parts(date);
  return `${p.d} ${p.month.slice(0, 3)} ${p.y}`;
}

/** "26 September 2026" */
export function formatDateMedium(date: string) {
  if (!date) return "";
  const p = parts(date);
  return `${p.d} ${p.month} ${p.y}`;
}

export function dateParts(date: string) {
  const p = parts(date);
  return { day: String(p.d), month: p.month.slice(0, 3), weekday: p.weekday.slice(0, 3), year: p.y };
}

/** "07:00" → "7:00 AM" */
export function formatTime(time: string) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time ?? "");
  if (!m) return time ?? "";
  const h = Number(m[1]);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${m[2]} ${suffix}`;
}

export function formatTimeRange(start: string, end: string) {
  if (!start) return "";
  return end ? `${formatTime(start)} – ${formatTime(end)}` : `${formatTime(start)} onwards`;
}

/** "07:30" + 120 → "09:30" (clamped to the same day). */
export function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = Math.min(23 * 60 + 59, h * 60 + m + minutes);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** 1 for the first occurrence of that weekday in the month, 2 for the second… */
export function weekOfMonth(date: string) {
  return Math.ceil(Number(date.slice(8, 10)) / 7);
}

/** "Today", "Tomorrow", "In 3 days", "Last week"… for a YYYY-MM-DD relative to today. */
export function relativeDay(date: string, today: string) {
  const d = daysBetween(today, date);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d === -1) return "Yesterday";
  if (d > 1 && d < 7) return `In ${d} days`;
  if (d >= 7 && d < 14) return "Next week";
  if (d < -1 && d > -7) return `${-d} days ago`;
  if (d <= -7 && d > -14) return "Last week";
  return "";
}

export function formatRelativeTimestamp(iso: string) {
  const diff = Date.now() - Date.parse(iso);
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} d ago`;
  return formatDateShort(iso.slice(0, 10));
}
