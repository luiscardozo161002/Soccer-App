/**
 * Formats a date-only value (calendar date with no meaningful time-of-day,
 * e.g. a match date or a birth date) without shifting it by the viewer's
 * timezone. These are stored as UTC midnight for the intended calendar day,
 * so `toLocaleDateString` without `timeZone: "UTC"` renders the previous day
 * for anyone west of UTC.
 */
export function formatCalendarDate(value: string | Date, options: Intl.DateTimeFormatOptions = {}) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("es-MX", { timeZone: "UTC", ...options });
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
