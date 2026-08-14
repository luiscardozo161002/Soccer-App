"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/http/endpoints";
import type { ItemResponse } from "@/lib/http/types";
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

export function useStandings(seasonId?: string) {
  return useQuery({
    queryKey: ["standings", seasonId ?? "active"],
    queryFn: () =>
      get<ItemResponse<StandingsRow[]>>(
        seasonId ? `/api/v1/standings?seasonId=${seasonId}` : "/api/v1/standings"
      ),
  });
}
