"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/http/endpoints";
import type { ItemResponse } from "@/lib/http/types";

export type SeasonStatus = "active" | "archived";

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  status: SeasonStatus;
}

export function useSeasons() {
  return useQuery({
    queryKey: ["seasons"],
    queryFn: () => get<ItemResponse<Season[]>>("/api/v1/seasons"),
  });
}

export function useSeason(id: string | undefined) {
  return useQuery({
    queryKey: ["seasons", id],
    queryFn: () => get<ItemResponse<Season>>(`/api/v1/seasons/${id}`),
    enabled: !!id,
  });
}
