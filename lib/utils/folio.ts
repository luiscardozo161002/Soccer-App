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

export function suggestFolioPrefix(name: string, isTaken: (prefix: string) => boolean): string {
  const words = wordsOf(name);
  const distinctive = words.filter((w) => !GENERIC_WORDS.has(w) && w.length > 0);
  const candidateWords = distinctive.length > 0 ? distinctive : words;

  const candidates: string[] = [];

  for (const w of candidateWords) {
    if (w.length >= 3) candidates.push(w.slice(0, 3));
  }

  const first = candidateWords[0] ?? "";
  for (let i = 1; i + 3 <= first.length; i++) {
    candidates.push(first.slice(i, i + 3));
  }

  if (candidateWords.length >= 2) {
    candidates.push(
      candidateWords
        .slice(0, 3)
        .map((w) => w[0])
        .join("")
        .padEnd(3, "X")
    );
  }

  candidates.push((words.join("") || "XXX").slice(0, 3).padEnd(3, "X"));

  for (const candidate of candidates) {
    if (candidate.length === 3 && !isTaken(candidate)) return candidate;
  }

  const base = (candidates[0] ?? "XXX").slice(0, 2);
  for (let n = 2; n <= 9; n++) {
    const candidate = `${base}${n}`;
    if (!isTaken(candidate)) return candidate;
  }
  throw new Error(`No se pudo generar un prefijo de folio único para "${name}"`);
}
