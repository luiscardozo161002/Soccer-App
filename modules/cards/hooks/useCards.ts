"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { cardApi, cardReasonConfigApi } from "../client/card.api";
import type { CardFilters, CardReasonConfigFilters, CreateCardInput, CreateCardReasonConfigInput, UpdateCardReasonConfigInput } from "../card.types";

export type { CardReasonConfig, CardType, MatchCard } from "../card.types";

export function useCards(matchId?: string, page = 1, pageSize = 100, extraFilters: Omit<CardFilters, "matchId" | "page" | "pageSize"> = {}) {
  const filters = { matchId, page, pageSize, ...extraFilters };
  return useQuery({ queryKey: queryKeys.cards.list(filters), queryFn: () => cardApi.list(filters) });
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: CreateCardInput) => cardApi.create(input), onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.cards.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.sanctions.all });
  } });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cardApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sanctions.all });
    },
  });
}

export function usePayCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cardApi.pay,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.cards.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.sanctions.all }),
      ]);
    },
  });
}

export function useRevertCardPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cardApi.revertPayment,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.cards.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.sanctions.all }),
      ]);
    },
  });
}

export function useCardReasonConfigs(filters: CardReasonConfigFilters = {}) {
  return useQuery({
    queryKey: queryKeys.cardReasonConfigs.list(filters),
    queryFn: () => cardReasonConfigApi.list(filters),
  });
}

export function useCreateCardReasonConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCardReasonConfigInput) => cardReasonConfigApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cardReasonConfigs.all }),
  });
}

export function useUpdateCardReasonConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCardReasonConfigInput & { id: string }) => cardReasonConfigApi.update(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cardReasonConfigs.all }),
  });
}
