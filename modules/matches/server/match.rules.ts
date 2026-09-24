import { ApiError } from "@/lib/errors";

export function toIsoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function toLocalIsoDay(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function assertMatchDateNotBefore(date: Date, today = new Date()) {
  if (toIsoDay(date) < toLocalIsoDay(today)) {
    throw new ApiError(422, "MATCH_DATE_IN_PAST", "La fecha del partido no puede ser anterior a hoy");
  }
}

export function toMatchDateTime(date: Date, time: string) {
  return new Date(`${toIsoDay(date)}T${time}:00`);
}
