"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/http/endpoints";
import type { ItemResponse } from "@/lib/http/types";
import { API_ROUTES } from "@/lib/http/api-routes";
import type { CreateCupDto } from "@/lib/validation/cup.schema";

export type CupStatus = "active" | "archived";

export interface Cup {
  id: string;
  name: string;
  status: CupStatus;
  createdAt: string;
  _count: { entries: number; matches: number };
}

export type CreateCupInput = CreateCupDto;

export function useCups() {
  return useQuery({
    queryKey: ["cups"],
    queryFn: () => get<ItemResponse<Cup[]>>(API_ROUTES.cups.list),
  });
}

export function useCup(id: string | undefined) {
  return useQuery({
    queryKey: ["cups", id],
    queryFn: () => get<ItemResponse<Cup>>(API_ROUTES.cups.byId(id!)),
    enabled: !!id,
  });
}

export function useCreateCup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCupInput) => post<ItemResponse<Cup>, CreateCupInput>(API_ROUTES.cups.list, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cups"] });
    },
  });
}
