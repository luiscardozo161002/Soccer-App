"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, post, remove } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";

export type CardType = "yellow" | "red";

export interface MatchCard {
  id: string;
  playerId: string;
  matchId: string;
  type: CardType;
  amount: string | null;
  detail: string | null;
  recordedAt: string;
  paid: boolean;
  player: {
    id: string;
    name: string;
    team: { id: string; name: string; category: string };
  };
  match: {
    id: string;
    matchday: number;
    date: string;
    homeTeam: { id: string; name: string };
    awayTeam: { id: string; name: string };
  };
}

export interface CreateCardInput {
  playerId: string;
  matchId: string;
  type: CardType;
  amount?: number;
  detail?: string;
}

export function useCards(matchId?: string) {
  return useQuery({
    queryKey: ["cards", { matchId }],
    queryFn: () =>
      get<ListResponse<MatchCard>>(
        `/api/v1/cards?pageSize=100${matchId ? `&matchId=${matchId}` : ""}`
      ),
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCardInput) =>
      post<ItemResponse<MatchCard>, CreateCardInput>("/api/v1/cards", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remove<void>(`/api/v1/cards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["sanctions"] });
    },
  });
}

export function usePayCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post<ItemResponse<MatchCard>, Record<string, never>>(`/api/v1/cards/${id}/pay`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}

export function useRevertCardPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patch<ItemResponse<MatchCard>, { paid: boolean }>(`/api/v1/cards/${id}`, { paid: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}
