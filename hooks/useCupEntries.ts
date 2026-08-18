"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, post } from "@/lib/http/endpoints";
import type { ItemResponse } from "@/lib/http/types";
import type { LeagueCategoryValue } from "@/lib/constants/league-categories";

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

export interface AddCupEntriesInput {
  cupId: string;
  teamIds: string[];
}

export interface WithdrawCupEntryInput {
  id: string;
  reason: string;
}

export function useCupEntries(cupId: string | undefined) {
  return useQuery({
    queryKey: ["cup-entries", cupId],
    queryFn: () => get<ItemResponse<CupEntry[]>>(`/api/v1/cup-entries?cupId=${cupId}`),
    enabled: !!cupId,
  });
}

export function useAddCupEntries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddCupEntriesInput) =>
      post<ItemResponse<CupEntry[]>, AddCupEntriesInput>("/api/v1/cup-entries", input),
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
      patch<ItemResponse<CupEntry>, { reason: string }>(`/api/v1/cup-entries/${id}/withdraw`, { reason }),
    onSuccess: () => {
      // A withdrawal can auto-resolve a pending match, so refresh both —
      // never ["standings"], Copa results never touch the league table.
      queryClient.invalidateQueries({ queryKey: ["cup-entries"] });
      queryClient.invalidateQueries({ queryKey: ["cup-matches"] });
    },
  });
}
