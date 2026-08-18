"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, post } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import { API_ROUTES } from "@/lib/http/api-routes";
import type { LeagueCategoryValue } from "@/lib/constants/league-categories";
import type {
  CreateCupMatchDto,
  UpdateCupMatchDto,
  RegisterCupResultDto,
} from "@/lib/validation/cup-match.schema";

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
  page?: number;
  pageSize?: number;
}

// date is `Date` in the server DTO (zod coerces the incoming string), but
// over JSON the wire shape is always a string.
export type CreateCupMatchInput = Omit<CreateCupMatchDto, "date"> & { date: string };
export type UpdateCupMatchInput = Omit<UpdateCupMatchDto, "date"> & { date?: string };
export type RegisterCupResultInput = RegisterCupResultDto;

function toQueryString(filters: CupMatchFilters) {
  const params = new URLSearchParams({
    cupId: filters.cupId,
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 20),
  });
  if (filters.round) params.set("round", filters.round);
  return params.toString();
}

export function useCupMatches(filters: CupMatchFilters) {
  return useQuery({
    queryKey: ["cup-matches", filters],
    queryFn: () => get<ListResponse<CupMatch>>(`${API_ROUTES.cupMatches.list}?${toQueryString(filters)}`),
    enabled: !!filters.cupId,
  });
}

export function useCreateCupMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCupMatchInput) =>
      post<ItemResponse<CupMatch>, CreateCupMatchInput>(API_ROUTES.cupMatches.list, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cup-matches"] });
    },
  });
}

export function useUpdateCupMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateCupMatchInput & { id: string }) =>
      patch<ItemResponse<CupMatch>, UpdateCupMatchInput>(API_ROUTES.cupMatches.byId(id), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cup-matches"] });
    },
  });
}

export function useRegisterCupResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: RegisterCupResultInput & { id: string }) =>
      patch<ItemResponse<CupMatch>, RegisterCupResultInput>(API_ROUTES.cupMatches.result(id), input),
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
    mutationFn: (id: string) =>
      post<ItemResponse<CupMatch>, Record<string, never>>(API_ROUTES.cupMatches.reopen(id), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cup-matches"] });
      queryClient.invalidateQueries({ queryKey: ["cup-entries"] });
    },
  });
}
