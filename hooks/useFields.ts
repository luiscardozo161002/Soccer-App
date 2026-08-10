"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, post, remove } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import type { EntityStatus } from "@/hooks/useTeams";

export interface Field {
  id: string;
  name: string;
  location: string | null;
  status: EntityStatus;
}

export interface CreateFieldInput {
  name: string;
  location?: string;
}

export type UpdateFieldInput = Partial<CreateFieldInput>;

export const FIELDS_PAGE_SIZE = 8;

export function googleMapsUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export function useFields(page = 1, pageSize = 100) {
  return useQuery({
    queryKey: ["fields", { page, pageSize }],
    queryFn: () => get<ListResponse<Field>>(`/api/v1/fields?page=${page}&pageSize=${pageSize}`),
  });
}

export function useCreateField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFieldInput) =>
      post<ItemResponse<Field>, CreateFieldInput>("/api/v1/fields", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields"] });
    },
  });
}

export function useUpdateField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateFieldInput & { id: string }) =>
      patch<ItemResponse<Field>, UpdateFieldInput>(`/api/v1/fields/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields"] });
    },
  });
}

export function useDeleteField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remove<void>(`/api/v1/fields/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields"] });
    },
  });
}
