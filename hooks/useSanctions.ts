"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, post } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import { API_ROUTES } from "@/lib/http/api-routes";
import type { CardType } from "@/hooks/useCards";
import type { CreateSanctionDto } from "@/lib/validation/sanction.schema";

export interface SanctionCard {
  id: string;
  type: CardType;
  detail: string | null;
  amount: string | null;
  player: {
    id: string;
    name: string;
    team: { id: string; name: string; category: string };
  };
  match: {
    id: string;
    matchday: number;
    date: string;
  };
}

export interface Sanction {
  id: string;
  cardId: string;
  matchdayStart: number;
  matchdayEnd: number;
  matchesSuspended: number;
  fulfilled: boolean;
  waivedByPayment: boolean;
  card: SanctionCard;
}

// cardId selects the URL (`API_ROUTES.cards.sanctions(cardId)`), it isn't
// part of the request body — the rest matches CreateSanctionDto exactly.
export type CreateSanctionInput = CreateSanctionDto & { cardId: string };

export function useSanctions(fulfilled?: boolean, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["sanctions", { fulfilled, page, pageSize }],
    queryFn: () =>
      get<ListResponse<Sanction>>(
        `${API_ROUTES.sanctions.list}?page=${page}&pageSize=${pageSize}${fulfilled !== undefined ? `&fulfilled=${fulfilled}` : ""}`
      ),
  });
}

export function useCreateSanction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, ...input }: CreateSanctionInput) =>
      post<ItemResponse<Sanction>, CreateSanctionDto>(API_ROUTES.cards.sanctions(cardId), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sanctions"] });
    },
  });
}

export function usePaySanction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      post<ItemResponse<Sanction>, Record<string, never>>(API_ROUTES.sanctions.pay(id), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sanctions"] });
    },
  });
}

export function useRevertSanction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      patch<ItemResponse<Sanction>, { fulfilled: boolean; waivedByPayment: boolean }>(
        API_ROUTES.sanctions.byId(id),
        { fulfilled: false, waivedByPayment: false }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sanctions"] });
    },
  });
}
