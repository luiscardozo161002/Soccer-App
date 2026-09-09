"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch } from "@/lib/http/endpoints";
import type { ItemResponse } from "@/lib/http/types";
import { API_ROUTES } from "@/lib/http/api-routes";
import type { UpdateSeasonDto } from "@/lib/validation/season.schema";

export type SeasonStatus = "active" | "archived";

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  status: SeasonStatus;
}

export type UpdateSeasonInput = UpdateSeasonDto;

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

export function useUpdateSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateSeasonInput & { id: string }) =>
      patch<ItemResponse<Season>, UpdateSeasonInput>(API_ROUTES.seasons.byId(id), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
    },
  });
}
