"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, post, remove } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import { API_ROUTES } from "@/lib/http/api-routes";
import type { LeagueCategoryValue } from "@/lib/constants/league-categories";
import type { CreateTeamDto, UpdateTeamDto } from "@/lib/validation/team.schema";

export type EntityStatus = "active" | "inactive";

export interface Team {
  id: string;
  name: string;
  photoType: string | null;
  photoUpdatedAt: string | null;
  registeredAt: string;
  category: LeagueCategoryValue;
  status: EntityStatus;
}

export type CreateTeamInput = CreateTeamDto;
export type UpdateTeamInput = UpdateTeamDto;

// See playerPhotoUrl for why the `v` cache-busting param is needed.
export function teamPhotoUrl(team: Pick<Team, "id" | "photoType" | "photoUpdatedAt">) {
  if (!team.photoType) return null;
  const v = team.photoUpdatedAt ? new Date(team.photoUpdatedAt).getTime() : 0;
  return `${API_ROUTES.teams.photo(team.id)}?v=${v}`;
}

/** Default pageSize=100 keeps existing lookup call sites (id -> name maps, form <select> options) working unpaginated. Pass TEAMS_PAGE_SIZE explicitly for the paginated admin table. */
export function useTeams(page = 1, pageSize = 100, category?: LeagueCategoryValue) {
  return useQuery({
    queryKey: ["teams", { page, pageSize, category }],
    queryFn: () =>
      get<ListResponse<Team>>(
        `${API_ROUTES.teams.list}?page=${page}&pageSize=${pageSize}${category ? `&category=${category}` : ""}`
      ),
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTeamInput) => post<ItemResponse<Team>, CreateTeamInput>(API_ROUTES.teams.list, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateTeamInput & { id: string }) =>
      patch<ItemResponse<Team>, UpdateTeamInput>(API_ROUTES.teams.byId(id), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remove<void>(API_ROUTES.teams.byId(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}
