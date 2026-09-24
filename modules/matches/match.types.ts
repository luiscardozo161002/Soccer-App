import type { LeagueCategoryValue } from "@/lib/constants/league-categories";
import type { CreateMatchDto, RegisterResultDto, UpdateMatchDto } from "./match.schema";

export type MatchStatus = "scheduled" | "played" | "postponed" | "cancelled";

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  fieldId: string;
  refereeId: string | null;
  matchday: number;
  date: string;
  time: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
  forfeit: boolean;
  forfeitReason: string | null;
  statusReason: string | null;
  resultLocked: boolean;
  resultEditedAt: string | null;
  resultEditedById: string | null;
  status: MatchStatus;
  category: LeagueCategoryValue;
}

export type CreateMatchInput = Omit<CreateMatchDto, "date"> & { date: string };
export type UpdateMatchInput = Omit<UpdateMatchDto, "date"> & { date?: string };
export type RegisterResultInput = RegisterResultDto;

export interface MatchFilters {
  matchday?: number;
  teamId?: string;
  status?: MatchStatus;
  category?: LeagueCategoryValue;
  refereeId?: string;
  page?: number;
  pageSize?: number;
}
