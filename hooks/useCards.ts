"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, post, remove } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import { API_ROUTES } from "@/lib/http/api-routes";
import type { CreateCardDto } from "@/lib/validation/card.schema";

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

export type CreateCardInput = CreateCardDto;

// Default pageSize=100 keeps existing unpaginated call sites (the per-match
// card tally on the matches page) working — pass an explicit smaller
// pageSize for a real paginated table (see CardsTable).
export function useCards(matchId?: string, page = 1, pageSize = 100) {
  return useQuery({
    queryKey: ["cards", { matchId, page, pageSize }],
    queryFn: () =>
      get<ListResponse<MatchCard>>(
        `${API_ROUTES.cards.list}?page=${page}&pageSize=${pageSize}${matchId ? `&matchId=${matchId}` : ""}`
      ),
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCardInput) =>
      post<ItemResponse<MatchCard>, CreateCardInput>(API_ROUTES.cards.list, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remove<void>(API_ROUTES.cards.byId(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["sanctions"] });
    },
  });
}

export function usePayCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post<ItemResponse<MatchCard>, Record<string, never>>(API_ROUTES.cards.pay(id), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}

export function useRevertCardPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      patch<ItemResponse<MatchCard>, { paid: boolean }>(API_ROUTES.cards.byId(id), { paid: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}
