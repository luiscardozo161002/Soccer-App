"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/http/endpoints";
import type { ItemResponse } from "@/lib/http/types";

export type CupStatus = "active" | "archived";

export interface Cup {
  id: string;
  name: string;
  status: CupStatus;
  createdAt: string;
  _count: { entries: number; matches: number };
}

export interface CreateCupInput {
  name: string;
}

export function useCups() {
  return useQuery({
    queryKey: ["cups"],
    queryFn: () => get<ItemResponse<Cup[]>>("/api/v1/cups"),
  });
}

export function useCup(id: string | undefined) {
  return useQuery({
    queryKey: ["cups", id],
    queryFn: () => get<ItemResponse<Cup>>(`/api/v1/cups/${id}`),
    enabled: !!id,
  });
}

export function useCreateCup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCupInput) => post<ItemResponse<Cup>, CreateCupInput>("/api/v1/cups", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cups"] });
    },
  });
}
