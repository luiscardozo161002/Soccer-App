"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, post, remove } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import type { LeagueCategoryValue } from "@/lib/constants/league-categories";

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

export interface CreateTeamInput {
  name: string;
  category?: LeagueCategoryValue;
  photo?: string;
}

export type UpdateTeamInput = Partial<CreateTeamInput>;

export const TEAMS_PAGE_SIZE = 8;

// See playerPhotoUrl for why the `v` cache-busting param is needed.
export function teamPhotoUrl(team: Pick<Team, "id" | "photoType" | "photoUpdatedAt">) {
  if (!team.photoType) return null;
  const v = team.photoUpdatedAt ? new Date(team.photoUpdatedAt).getTime() : 0;
  return `/api/v1/teams/${team.id}/photo?v=${v}`;
}

/** Default pageSize=100 keeps existing lookup call sites (id -> name maps, form <select> options) working unpaginated. Pass TEAMS_PAGE_SIZE explicitly for the paginated admin table. */
export function useTeams(page = 1, pageSize = 100) {
  return useQuery({
    queryKey: ["teams", { page, pageSize }],
    queryFn: () => get<ListResponse<Team>>(`/api/v1/teams?page=${page}&pageSize=${pageSize}`),
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTeamInput) => post<ItemResponse<Team>, CreateTeamInput>("/api/v1/teams", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateTeamInput & { id: string }) =>
      patch<ItemResponse<Team>, UpdateTeamInput>(`/api/v1/teams/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remove<void>(`/api/v1/teams/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}
