"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, post } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";

export type MatchStatus = "scheduled" | "played" | "postponed" | "cancelled";

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  fieldId: string;
  matchday: number;
  date: string;
  time: string;
  homeGoals: number | null;
  awayGoals: number | null;
  status: MatchStatus;
}

export interface CreateMatchInput {
  homeTeamId: string;
  awayTeamId: string;
  fieldId: string;
  matchday: number;
  date: string;
  time: string;
}

export interface UpdateMatchInput {
  fieldId?: string;
  matchday?: number;
  date?: string;
  time?: string;
  status?: MatchStatus;
}

export interface RegisterResultInput {
  homeGoals: number;
  awayGoals: number;
}

export interface MatchFilters {
  matchday?: number;
  teamId?: string;
  status?: MatchStatus;
  page?: number;
  pageSize?: number;
}

export const MATCHES_PAGE_SIZE = 8;

function toQueryString(filters: MatchFilters) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 100),
  });
  if (filters.matchday) params.set("matchday", String(filters.matchday));
  if (filters.teamId) params.set("teamId", filters.teamId);
  if (filters.status) params.set("status", filters.status);
  return params.toString();
}

export function useMatches(filters: MatchFilters = {}) {
  return useQuery({
    queryKey: ["matches", filters],
    queryFn: () => get<ListResponse<Match>>(`/api/v1/matches?${toQueryString(filters)}`),
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMatchInput) =>
      post<ItemResponse<Match>, CreateMatchInput>("/api/v1/matches", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useUpdateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateMatchInput & { id: string }) =>
      patch<ItemResponse<Match>, UpdateMatchInput>(`/api/v1/matches/${id}`, input),
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
      patch<ItemResponse<Match>, RegisterResultInput>(`/api/v1/matches/${id}/result`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["standings"] });
    },
  });
}
