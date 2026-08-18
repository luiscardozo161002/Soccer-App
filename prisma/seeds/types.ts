import type { LeagueCategoryValue } from "../../lib/constants/league-categories";

export type TeamSeed = { name: string; category?: LeagueCategoryValue };
export type FieldSeed = { name: string; location?: string };
export type PlayerSeed = {
  team: string;
  name: string;
  registrationNumber: string;
  birthDate?: string;
};
export type MatchSeed = {
  homeTeam: string;
  awayTeam: string;
  field: string;
  matchday: number;
  date: string;
  time: string;
  status?: "scheduled" | "played" | "postponed" | "cancelled";
  homeGoals?: number;
  awayGoals?: number;
};
export type CardSeed = {
  player: string;
  match: { homeTeam: string; awayTeam: string; matchday: number };
  type: "yellow" | "red";
  detail?: string;
  amount?: number;
};
export type SanctionSeed = {
  player: string;
  cardMatchday: number;
  matchdayStart: number;
  matchdayEnd: number;
  matchesSuspended: number;
};
export type AdminUserSeed = {
  username: string;
  email: string;
  password: string;
  phoneNumber?: string;
};

export const matchKey = (homeTeam: string, awayTeam: string, matchday: number) =>
  `${homeTeam}|${awayTeam}|${matchday}`;
