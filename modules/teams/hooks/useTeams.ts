"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LeagueCategoryValue } from "@/lib/constants/league-categories";
import { queryKeys } from "@/lib/query/query-keys";
import { teamApi, teamPhotoUrl } from "../client/team.api";
import type { CreateTeamInput, TeamFilters, UpdateTeamInput } from "../team.types";

export { teamPhotoUrl };
export type { CreateTeamInput, EntityStatus, Team, TeamFilters, UpdateTeamInput } from "../team.types";

export function useTeams(page = 1, pageSize = 100, category?: LeagueCategoryValue) {
  const filters: TeamFilters = { page, pageSize, category };
  return useQuery({
    queryKey: queryKeys.teams.list(filters),
    queryFn: () => teamApi.list(filters),
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTeamInput) => teamApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.teams.all }),
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTeamInput & { id: string }) => teamApi.update(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.teams.all }),
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: teamApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.teams.all }),
  });
}
