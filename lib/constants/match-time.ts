// Matches can only be scheduled 9:00-16:00; shared by the client's dropdown
// (a native time picker can't hide out-of-range options) and the zod schema.
export const MIN_MATCH_TIME = "09:00";
export const MAX_MATCH_TIME = "16:00";

const STEP_MINUTES = 15;

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function isWithinMatchTimeWindow(time: string) {
  return time >= MIN_MATCH_TIME && time <= MAX_MATCH_TIME;
}

export function matchTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const end = toMinutes(MAX_MATCH_TIME);
  for (let minutes = toMinutes(MIN_MATCH_TIME); minutes <= end; minutes += STEP_MINUTES) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const period = h < 12 ? "a. m." : "p. m.";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    options.push({ value, label: `${h12}:${String(m).padStart(2, "0")} ${period}` });
  }
  return options;
}
