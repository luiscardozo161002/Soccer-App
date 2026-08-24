"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post, patch } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import { API_ROUTES } from "@/lib/http/api-routes";
import type { CardType } from "@/hooks/useCards";
import type { CreateCardReasonConfigDto, UpdateCardReasonConfigDto } from "@/lib/validation/card-reason-config.schema";

export interface CardReasonConfig {
  id: string;
  cardType: CardType;
  reason: string;
  amount: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateCardReasonConfigInput = CreateCardReasonConfigDto;
export type UpdateCardReasonConfigInput = UpdateCardReasonConfigDto;

export interface CardReasonConfigFilters {
  cardType?: CardType;
  active?: boolean;
  page?: number;
  pageSize?: number;
}

// Default pageSize=100 keeps existing "give me everything for this type"
// call sites (the card-creation form's reason dropdown) working — pass an
// explicit smaller pageSize for a real paginated table (see CardReasonConfigTable).
export function useCardReasonConfigs(filters: CardReasonConfigFilters = {}) {
  const { page = 1, pageSize = 100, cardType, active } = filters;
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (cardType) params.set("cardType", cardType);
  if (active !== undefined) params.set("active", String(active));
  return useQuery({
    queryKey: ["cardReasonConfigs", { page, pageSize, cardType, active }],
    queryFn: () => get<ListResponse<CardReasonConfig>>(`${API_ROUTES.cardReasonConfigs.list}?${params.toString()}`),
  });
}

export function useCreateCardReasonConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCardReasonConfigInput) =>
      post<ItemResponse<CardReasonConfig>, CreateCardReasonConfigInput>(API_ROUTES.cardReasonConfigs.list, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardReasonConfigs"] });
    },
  });
}

export function useUpdateCardReasonConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateCardReasonConfigInput & { id: string }) =>
      patch<ItemResponse<CardReasonConfig>, UpdateCardReasonConfigInput>(
        API_ROUTES.cardReasonConfigs.byId(id),
        input
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardReasonConfigs"] });
    },
  });
}
