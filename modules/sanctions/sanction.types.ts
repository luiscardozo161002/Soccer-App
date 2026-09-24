import type { CardType } from "@/modules/cards/card.types";
import type { CreateSanctionDto } from "./sanction.schema";
import type { LeagueCategoryValue } from "@/lib/constants/league-categories";

export interface SanctionCard {
  id: string;
  type: CardType;
  detail: string | null;
  amount: string | null;
  player: {
    id: string;
    name: string;
    photoType: string | null;
    photoUpdatedAt: string | null;
    team: { id: string; name: string; category: string };
  };
  match: { id: string; matchday: number; date: string };
}

export interface Sanction {
  id: string;
  cardId: string;
  matchdayStart: number;
  matchdayEnd: number;
  matchesSuspended: number;
  fulfilled: boolean;
  waivedByPayment: boolean;
  card: SanctionCard;
  _count: { appliedMatches: number };
}

export interface SanctionFilters {
  fulfilled?: boolean;
  category?: LeagueCategoryValue;
  search?: string;
  page?: number;
  pageSize?: number;
}

export type CreateSanctionInput = CreateSanctionDto & { cardId: string };
