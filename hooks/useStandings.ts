"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/http/endpoints";
import type { ItemResponse } from "@/lib/http/types";

export interface StandingsRow {
  teamId: string;
  name: string;
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

export function useStandings() {
  return useQuery({
    queryKey: ["standings"],
    queryFn: () => get<ItemResponse<StandingsRow[]>>("/api/v1/standings"),
  });
}
