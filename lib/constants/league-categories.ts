export const LEAGUE_CATEGORIES = [
  { value: "primera_division", label: "Primera División", short: "1ª" },
  { value: "division_ascenso", label: "División de Ascenso", short: "Asc" },
  { value: "segunda_division", label: "Segunda División", short: "2ª" },
] as const;

export type LeagueCategoryValue = (typeof LEAGUE_CATEGORIES)[number]["value"];

export const CATEGORY_BADGE_CLASSES: Record<LeagueCategoryValue, string> = {
  primera_division: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  division_ascenso: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  segunda_division: "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-white/70",
};

export const CATEGORY_DOT_CLASSES: Record<LeagueCategoryValue, string> = {
  primera_division: "bg-amber-400",
  division_ascenso: "bg-blue-400",
  segunda_division: "bg-slate-400",
};

export function categoryLabel(value: string) {
  return LEAGUE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function categoryShort(value: string) {
  return LEAGUE_CATEGORIES.find((c) => c.value === value)?.short ?? value;
}
