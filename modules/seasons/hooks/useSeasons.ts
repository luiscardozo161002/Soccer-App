"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { seasonApi } from "../client/season.api";
import type { UpdateSeasonInput } from "../season.types";

export type { Season, SeasonStatus, UpdateSeasonInput } from "../season.types";

export function useSeasons() {
  return useQuery({ queryKey: queryKeys.seasons.all, queryFn: seasonApi.list });
}

export function useSeason(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.seasons.detail(id ?? "missing"),
    queryFn: () => seasonApi.get(id!),
    enabled: !!id,
  });
}

export function useUpdateSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSeasonInput & { id: string }) => seasonApi.update(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.seasons.all }),
  });
}

export function useResetTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: seasonApi.resetTournament,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.standings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.seasons.all });
    },
  });
}
