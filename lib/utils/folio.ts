// Shared by the team create form (client-side suggestion) and the
// backfill-team-folio-prefixes seed script (Node), so both produce the same
// prefix for the same name — no framework/browser APIs, plain string logic.

// Words that show up in many team names but don't identify the team on
// their own (ej. "DEPORTIVO BARCELONA" / "DEP. BOMINTZHÁ" / "CLUB SAN
// PABLO") — skipped when picking which word to abbreviate.
const GENERIC_WORDS = new Set([
  "DE",
  "DEL",
  "LA",
  "LAS",
  "LOS",
  "EL",
  "Y",
  "F",
  "C",
  "A",
  "U",
  "FC",
  "CD",
  "AC",
  "CF",
  "SAN",
  "REAL",
  "CLUB",
  "DEP",
  "ATL",
  "ATM",
  "DEPORTIVO",
  "ATLETICO",
  "COMBINADO",
  "JUVENIL",
  "JUVENTUD",
  "JUVENTUS",
  "PUMAS",
]);

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function wordsOf(name: string) {
  return stripAccents(name)
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Suggests a 3-character folio prefix for a team name, skipping generic
 * words so distinct teams don't all collapse to the same prefix (ej. the
 * ~19 teams named "DEPORTIVO ..."/"DEP. ..." in this league). `isTaken`
 * is called with each candidate — return true if another team already
 * uses it — so the result is always unique.
 */
export function suggestFolioPrefix(name: string, isTaken: (prefix: string) => boolean): string {
  const words = wordsOf(name);
  const distinctive = words.filter((w) => !GENERIC_WORDS.has(w) && w.length > 0);
  const candidateWords = distinctive.length > 0 ? distinctive : words;

  const candidates: string[] = [];
  // Each distinctive word's first 3 letters, in order.
  for (const w of candidateWords) {
    if (w.length >= 3) candidates.push(w.slice(0, 3));
  }
  // Sliding window within the first distinctive word (BOMINTZHA -> BOM, OMI, MIN...).
  const first = candidateWords[0] ?? "";
  for (let i = 1; i + 3 <= first.length; i++) {
    candidates.push(first.slice(i, i + 3));
  }
  // First letter of up to 3 distinctive words (DEPORTIVO SAN MARTIN -> DSM-ish).
  if (candidateWords.length >= 2) {
    candidates.push(
      candidateWords
        .slice(0, 3)
        .map((w) => w[0])
        .join("")
        .padEnd(3, "X")
    );
  }
  // Whole name concatenated, ignoring spaces, as a last structural fallback.
  candidates.push((words.join("") || "XXX").slice(0, 3).padEnd(3, "X"));

  for (const candidate of candidates) {
    if (candidate.length === 3 && !isTaken(candidate)) return candidate;
  }

  // Every letter-based candidate collided — disambiguate the best guess
  // with a trailing digit rather than fail outright.
  const base = (candidates[0] ?? "XXX").slice(0, 2);
  for (let n = 2; n <= 9; n++) {
    const candidate = `${base}${n}`;
    if (!isTaken(candidate)) return candidate;
  }
  throw new Error(`No se pudo generar un prefijo de folio único para "${name}"`);
}

/**
 * Next player folio for a team (ej. "TIG-004"), given every folio already
 * issued under that team's prefix. Sequence never reuses a number — it
 * always continues from the highest one seen, even if some player in
 * between was deleted.
 */
export function nextPlayerFolio(prefix: string, existingNumbers: string[]): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  let max = 0;
  for (const value of existingNumbers) {
    const match = pattern.exec(value);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}
