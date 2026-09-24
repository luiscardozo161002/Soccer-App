"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { playerApi, playerPhotoUrl } from "../client/player.api";
import type { CreatePlayerInput, PlayerFilters, UpdatePlayerInput } from "../player.types";

export { playerPhotoUrl };
export type { CreatePlayerInput, Player, PlayerFilters, UpdatePlayerInput } from "../player.types";

export function usePlayers(filters: PlayerFilters = {}) {
  const resolvedFilters = {
    ...filters,
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 100,
  };
  return useQuery({
    queryKey: queryKeys.players.list(resolvedFilters),
    queryFn: () => playerApi.list(resolvedFilters),
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlayerInput) => playerApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.players.all }),
  });
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePlayerInput & { id: string }) => playerApi.update(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.players.all }),
  });
}

export function useDeletePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: playerApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.players.all }),
  });
}
