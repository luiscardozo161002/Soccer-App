"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, post } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import { API_ROUTES } from "@/lib/http/api-routes";
import type { LeagueCategoryValue } from "@/lib/constants/league-categories";
import type { CreateCupEntriesDto, WithdrawCupEntryDto } from "@/lib/validation/cup-entry.schema";

export type CupEntryStatus = "active" | "eliminated" | "withdrawn";

export interface CupEntry {
  id: string;
  cupId: string;
  teamId: string;
  status: CupEntryStatus;
  eliminatedReason: string | null;
  eliminatedAt: string | null;
  team: { id: string; name: string; category: LeagueCategoryValue };
}

export type AddCupEntriesInput = CreateCupEntriesDto;
export type WithdrawCupEntryInput = WithdrawCupEntryDto & { id: string };

export function useCupEntries(cupId: string | undefined, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["cup-entries", cupId, { page, pageSize }],
    queryFn: () =>
      get<ListResponse<CupEntry>>(`${API_ROUTES.cupEntries.list}?cupId=${cupId}&page=${page}&pageSize=${pageSize}`),
    enabled: !!cupId,
  });
}

export function useAddCupEntries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddCupEntriesInput) =>
      post<ItemResponse<null>, AddCupEntriesInput>(API_ROUTES.cupEntries.list, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cup-entries", variables.cupId] });
      queryClient.invalidateQueries({ queryKey: ["cups"] });
    },
  });
}

export function useWithdrawCupEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: WithdrawCupEntryInput) =>
      patch<ItemResponse<CupEntry>, WithdrawCupEntryDto>(API_ROUTES.cupEntries.withdraw(id), { reason }),
    onSuccess: () => {
      // A withdrawal can auto-resolve a pending match, so refresh both —
      // never ["standings"], Copa results never touch the league table.
      queryClient.invalidateQueries({ queryKey: ["cup-entries"] });
      queryClient.invalidateQueries({ queryKey: ["cup-matches"] });
    },
  });
}
