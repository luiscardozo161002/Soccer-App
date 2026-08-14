"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, post } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import type { CardType } from "@/hooks/useCards";

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

export interface CreateSanctionInput {
  cardId: string;
  matchdayStart: number;
  matchdayEnd: number;
  matchesSuspended: number;
}

export function useSanctions(fulfilled?: boolean) {
  return useQuery({
    queryKey: ["sanctions", { fulfilled }],
    queryFn: () =>
      get<ListResponse<Sanction>>(
        `/api/v1/sanctions?pageSize=100${fulfilled !== undefined ? `&fulfilled=${fulfilled}` : ""}`
      ),
  });
}

export function useCreateSanction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, ...input }: CreateSanctionInput) =>
      post<ItemResponse<Sanction>, Omit<CreateSanctionInput, "cardId">>(
        `/api/v1/cards/${cardId}/sanctions`,
        input
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sanctions"] });
    },
  });
}

export function usePaySanction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post<ItemResponse<Sanction>, Record<string, never>>(`/api/v1/sanctions/${id}/pay`, {}),
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
        `/api/v1/sanctions/${id}`,
        { fulfilled: false, waivedByPayment: false }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sanctions"] });
    },
  });
}
