"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/http/endpoints";
import type { ListResponse } from "@/lib/http/types";

export type CardType = "yellow" | "red";

export interface MatchCard {
  id: string;
  playerId: string;
  matchId: string;
  type: CardType;
  amount: string | null;
  detail: string | null;
  recordedAt: string;
}

export function useCards(matchId?: string) {
  return useQuery({
    queryKey: ["cards", { matchId }],
    queryFn: () =>
      get<ListResponse<MatchCard>>(
        `/api/v1/cards?pageSize=100${matchId ? `&matchId=${matchId}` : ""}`
      ),
  });
}
