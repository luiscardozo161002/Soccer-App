import type { LeagueCategoryValue } from "@/lib/constants/league-categories";

export interface StandingsRow {
  teamId: string;
  name: string;
  category: LeagueCategoryValue;
  played: number;
  pending: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}
