"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, post, remove } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import { API_ROUTES } from "@/lib/http/api-routes";
import type { EntityStatus } from "@/hooks/useTeams";
import type { LeagueCategoryValue } from "@/lib/constants/league-categories";
import type { CreatePlayerDto, UpdatePlayerDto } from "@/lib/validation/player.schema";

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

// birthDate is `Date` in the server DTO (zod coerces the incoming string),
// but over JSON the wire shape is always a string — override just that
// field rather than aliasing the DTO type as-is.
export type CreatePlayerInput = Omit<CreatePlayerDto, "birthDate"> & { birthDate?: string };
export type UpdatePlayerInput = Omit<UpdatePlayerDto, "birthDate"> & { birthDate?: string };

// The `v` param busts the browser's per-URL image cache: without it, an <img>
// already rendered at this src won't refetch after the photo changes, even
// though the server data (and React Query cache) is fresh.
export function playerPhotoUrl(player: Pick<Player, "id" | "photoType" | "photoUpdatedAt">) {
  if (!player.photoType) return null;
  const v = player.photoUpdatedAt ? new Date(player.photoUpdatedAt).getTime() : 0;
  return `${API_ROUTES.players.photo(player.id)}?v=${v}`;
}

export function usePlayers({
  teamId,
  category,
  page = 1,
  pageSize = 100,
}: { teamId?: string; category?: LeagueCategoryValue; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["players", { teamId, category, page, pageSize }],
    queryFn: () =>
      get<ListResponse<Player>>(
        `${API_ROUTES.players.list}?page=${page}&pageSize=${pageSize}${teamId ? `&teamId=${teamId}` : ""}${category ? `&category=${category}` : ""}`
      ),
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlayerInput) =>
      post<ItemResponse<Player>, CreatePlayerInput>(API_ROUTES.players.list, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdatePlayerInput & { id: string }) =>
      patch<ItemResponse<Player>, UpdatePlayerInput>(API_ROUTES.players.byId(id), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}

export function useDeletePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remove<void>(API_ROUTES.players.byId(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}
