"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, post } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import { API_ROUTES } from "@/lib/http/api-routes";
import type { LeagueCategoryValue } from "@/lib/constants/league-categories";
import type { CreateMatchDto, UpdateMatchDto, RegisterResultDto } from "@/lib/validation/match.schema";

export type MatchStatus = "scheduled" | "played" | "postponed" | "cancelled";

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  fieldId: string;
  matchday: number;
  date: string;
  time: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
  forfeit: boolean;
  forfeitReason: string | null;
  statusReason: string | null;
  resultLocked: boolean;
  status: MatchStatus;
  category: LeagueCategoryValue;
}

// date is `Date` in the server DTO (zod coerces the incoming string), but
// over JSON the wire shape is always a string.
export type CreateMatchInput = Omit<CreateMatchDto, "date"> & { date: string };
export type UpdateMatchInput = Omit<UpdateMatchDto, "date"> & { date?: string };
export type RegisterResultInput = RegisterResultDto;

export interface MatchFilters {
  matchday?: number;
  teamId?: string;
  status?: MatchStatus;
  category?: LeagueCategoryValue;
  page?: number;
  pageSize?: number;
}

function toQueryString(filters: MatchFilters) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 100),
  });
  if (filters.matchday) params.set("matchday", String(filters.matchday));
  if (filters.teamId) params.set("teamId", filters.teamId);
  if (filters.status) params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  return params.toString();
}

export function useMatches(filters: MatchFilters = {}) {
  return useQuery({
    queryKey: ["matches", filters],
    queryFn: () => get<ListResponse<Match>>(`${API_ROUTES.matches.list}?${toQueryString(filters)}`),
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMatchInput) =>
      post<ItemResponse<Match>, CreateMatchInput>(API_ROUTES.matches.list, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useUpdateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateMatchInput & { id: string }) =>
      patch<ItemResponse<Match>, UpdateMatchInput>(API_ROUTES.matches.byId(id), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["standings"] });
    },
  });
}

export function useRegisterResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: RegisterResultInput & { id: string }) =>
      patch<ItemResponse<Match>, RegisterResultInput>(API_ROUTES.matches.result(id), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["standings"] });
    },
  });
}
