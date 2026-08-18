"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/http/endpoints";
import type { ItemResponse } from "@/lib/http/types";
import { API_ROUTES } from "@/lib/http/api-routes";

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
    queryFn: () => get<ItemResponse<Season[]>>(API_ROUTES.seasons.list),
  });
}

export function useSeason(id: string | undefined) {
  return useQuery({
    queryKey: ["seasons", id],
    queryFn: () => get<ItemResponse<Season>>(API_ROUTES.seasons.byId(id!)),
    enabled: !!id,
  });
}
