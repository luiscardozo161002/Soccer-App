"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, post } from "@/lib/http/endpoints";
import type { ItemResponse } from "@/lib/http/types";
import type { LeagueCategoryValue } from "@/lib/constants/league-categories";

export type CupMatchStatus = "scheduled" | "played" | "postponed" | "cancelled";

interface CupMatchTeam {
  id: string;
  name: string;
  category: LeagueCategoryValue;
}

export interface CupMatch {
  id: string;
  cupId: string;
  round: string;
  homeTeamId: string;
  awayTeamId: string;
  fieldId: string | null;
  date: string;
  time: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
  forfeit: boolean;
  forfeitReason: string | null;
  resultLocked: boolean;
  status: CupMatchStatus;
  createdAt: string;
  homeTeam: CupMatchTeam;
  awayTeam: CupMatchTeam;
  field: { id: string; name: string } | null;
}

export interface CupMatchFilters {
  cupId: string;
  round?: string;
}

export interface CreateCupMatchInput {
  cupId: string;
  round: string;
  homeTeamId: string;
  awayTeamId: string;
  fieldId?: string;
  date: string;
  time?: string;
}

export interface UpdateCupMatchInput {
  round?: string;
  fieldId?: string;
  date?: string;
  time?: string;
  status?: Exclude<CupMatchStatus, "played">;
}

export interface RegisterCupResultInput {
  homeGoals: number;
  awayGoals: number;
  forfeit?: boolean;
  forfeitReason?: string;
}

function toQueryString(filters: CupMatchFilters) {
  const params = new URLSearchParams({ cupId: filters.cupId });
  if (filters.round) params.set("round", filters.round);
  return params.toString();
}

export function useCupMatches(filters: CupMatchFilters) {
  return useQuery({
    queryKey: ["cup-matches", filters],
    queryFn: () => get<ItemResponse<CupMatch[]>>(`/api/v1/cup-matches?${toQueryString(filters)}`),
    enabled: !!filters.cupId,
  });
}

export function useCreateCupMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCupMatchInput) =>
      post<ItemResponse<CupMatch>, CreateCupMatchInput>("/api/v1/cup-matches", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cup-matches"] });
    },
  });
}

export function useUpdateCupMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateCupMatchInput & { id: string }) =>
      patch<ItemResponse<CupMatch>, UpdateCupMatchInput>(`/api/v1/cup-matches/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cup-matches"] });
    },
  });
}

export function useRegisterCupResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: RegisterCupResultInput & { id: string }) =>
      patch<ItemResponse<CupMatch>, RegisterCupResultInput>(`/api/v1/cup-matches/${id}/result`, input),
    onSuccess: () => {
      // Never invalidates ["standings"] — Copa results stay out of the Liga table.
      queryClient.invalidateQueries({ queryKey: ["cup-matches"] });
      queryClient.invalidateQueries({ queryKey: ["cup-entries"] });
    },
  });
}

export function useReopenCupMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post<ItemResponse<CupMatch>, Record<string, never>>(`/api/v1/cup-matches/${id}/reopen`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cup-matches"] });
      queryClient.invalidateQueries({ queryKey: ["cup-entries"] });
    },
  });
}
