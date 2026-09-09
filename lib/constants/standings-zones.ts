import type { LeagueCategoryValue } from "@/lib/constants/league-categories";

export type StandingsZone = "qualified" | "contention" | "relegation";

// Fixed cutoffs confirmed against the league's official standings sheets:
// top 8 qualify in every category; positions 9-14 are "in contention" for
// Primera División and División de Ascenso, with 15-16 relegated — Segunda
// División has no relegation (it's the bottom division), so everyone below
// the top 8 is just "in contention".
export function standingsZone(category: LeagueCategoryValue, rank: number): StandingsZone {
  if (rank < 8) return "qualified";
  if (category === "segunda_division") return "contention";
  return rank < 14 ? "contention" : "relegation";
}

export const STANDINGS_ZONE_LABELS: Record<StandingsZone, string> = {
  qualified: "Calificado",
  contention: "Con posibilidades",
  relegation: "Descenso",
};

export const STANDINGS_ZONE_BADGE_CLASSES: Record<StandingsZone, string> = {
  qualified: "bg-emerald-500 text-white",
  contention: "bg-amber-400 text-black",
  relegation: "bg-red-500 text-white",
};

export const STANDINGS_ZONE_DOT_CLASSES: Record<StandingsZone, string> = {
  qualified: "bg-emerald-500",
  contention: "bg-amber-400",
  relegation: "bg-red-500",
};

// Segunda División never shows the "Descenso" chip in the legend.
export function standingsZonesForCategory(category: LeagueCategoryValue): StandingsZone[] {
  return category === "segunda_division"
    ? ["qualified", "contention"]
    : ["qualified", "contention", "relegation"];
}
