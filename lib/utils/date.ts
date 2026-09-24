export function formatCalendarDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {},
  locale = "es-MX"
) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString(locale, { timeZone: "UTC", ...options });
}

export function hasMatchStarted(date: string | Date, time: string | null) {
  const isoDay = typeof date === "string" ? date.slice(0, 10) : date.toISOString().slice(0, 10);
  return new Date(`${isoDay}T${time ?? "23:59"}:00`) <= new Date();
}

export function todayLocalISODate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
