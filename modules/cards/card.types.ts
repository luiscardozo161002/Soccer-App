import type { CreateCardReasonConfigDto, UpdateCardReasonConfigDto } from "./card-reason-config.schema";
import type { CreateCardDto } from "./card.schema";
import type { LeagueCategoryValue } from "@/lib/constants/league-categories";

export type CardType = "yellow" | "red";

export interface MatchCard {
  id: string;
  playerId: string;
  matchId: string;
  type: CardType;
  amount: string | null;
  detail: string | null;
  recordedAt: string;
  paid: boolean;
  player: { id: string; name: string; team: { id: string; name: string; category: string } };
  match: {
    id: string;
    matchday: number;
    date: string;
    homeTeam: { id: string; name: string };
    awayTeam: { id: string; name: string };
  };
}

export interface CardFilters {
  matchId?: string;
  playerId?: string;
  type?: CardType;
  paid?: boolean;
  category?: LeagueCategoryValue;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CardReasonConfig {
  id: string;
  cardType: CardType;
  reason: string;
  amount: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CardReasonConfigFilters {
  cardType?: CardType;
  active?: boolean;
  page?: number;
  pageSize?: number;
}

export type CreateCardInput = CreateCardDto;
export type CreateCardReasonConfigInput = CreateCardReasonConfigDto;
export type UpdateCardReasonConfigInput = UpdateCardReasonConfigDto;
