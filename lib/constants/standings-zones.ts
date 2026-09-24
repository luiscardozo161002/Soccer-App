import type { LeagueCategoryValue } from "@/lib/constants/league-categories";

export type StandingsZone = "qualified" | "contention" | "relegation";

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

export function standingsZonesForCategory(category: LeagueCategoryValue): StandingsZone[] {
  return category === "segunda_division"
    ? ["qualified", "contention"]
    : ["qualified", "contention", "relegation"];
}
