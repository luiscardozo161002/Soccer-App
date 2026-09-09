/**
 * Formats a date-only value (calendar date with no meaningful time-of-day,
 * e.g. a match date or a birth date) without shifting it by the viewer's
 * timezone. These are stored as UTC midnight for the intended calendar day,
 * so `toLocaleDateString` without `timeZone: "UTC"` renders the previous day
 * for anyone west of UTC.
 */
export function formatCalendarDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {},
  locale = "es-MX"
) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString(locale, { timeZone: "UTC", ...options });
}

/**
 * Whether a match's scheduled kickoff (date + time) is already in the past.
 * Mirrors matchService's private `toDateTime` combining convention (no
 * explicit timezone suffix — interpreted in the caller's local time) so
 * "started" means the same thing here as it does when the server blocks
 * early result registration.
 */
export function hasMatchStarted(date: string | Date, time: string | null) {
  const isoDay = typeof date === "string" ? date.slice(0, 10) : date.toISOString().slice(0, 10);
  return new Date(`${isoDay}T${time ?? "23:59"}:00`) <= new Date();
}

/**
 * Today's date in the viewer's local timezone, as YYYY-MM-DD — for the
 * `min` attribute of a date input. `new Date().toISOString().slice(0, 10)`
 * would use UTC instead, which can be a day off from the viewer's "today"
 * near midnight in negative-UTC-offset timezones.
 */
export function todayLocalISODate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
