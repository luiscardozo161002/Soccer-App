"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, post, remove } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import type { EntityStatus } from "@/hooks/useTeams";

export interface Player {
  id: string;
  teamId: string;
  name: string;
  photoType: string | null;
  photoUpdatedAt: string | null;
  birthDate: string | null;
  registrationNumber: string;
  status: EntityStatus;
}

export interface CreatePlayerInput {
  teamId: string;
  name: string;
  registrationNumber: string;
  birthDate?: string;
  photo?: string;
}

export type UpdatePlayerInput = Partial<Omit<CreatePlayerInput, "photo">> & { photo?: string | null };

export const PLAYERS_PAGE_SIZE = 8;

// The `v` param busts the browser's per-URL image cache: without it, an <img>
// already rendered at this src won't refetch after the photo changes, even
// though the server data (and React Query cache) is fresh.
export function playerPhotoUrl(player: Pick<Player, "id" | "photoType" | "photoUpdatedAt">) {
  if (!player.photoType) return null;
  const v = player.photoUpdatedAt ? new Date(player.photoUpdatedAt).getTime() : 0;
  return `/api/v1/players/${player.id}/photo?v=${v}`;
}

export function usePlayers({
  teamId,
  page = 1,
  pageSize = 100,
}: { teamId?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["players", { teamId, page, pageSize }],
    queryFn: () =>
      get<ListResponse<Player>>(
        `/api/v1/players?page=${page}&pageSize=${pageSize}${teamId ? `&teamId=${teamId}` : ""}`
      ),
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlayerInput) =>
      post<ItemResponse<Player>, CreatePlayerInput>("/api/v1/players", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdatePlayerInput & { id: string }) =>
      patch<ItemResponse<Player>, UpdatePlayerInput>(`/api/v1/players/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}

export function useDeletePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remove<void>(`/api/v1/players/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}
