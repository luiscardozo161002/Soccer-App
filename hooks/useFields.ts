"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, post, remove } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import { API_ROUTES } from "@/lib/http/api-routes";
import type { EntityStatus } from "@/hooks/useTeams";
import type { CreateFieldDto, UpdateFieldDto } from "@/lib/validation/field.schema";

export interface Field {
  id: string;
  name: string;
  location: string | null;
  status: EntityStatus;
}

export type CreateFieldInput = CreateFieldDto;
export type UpdateFieldInput = UpdateFieldDto;

export function googleMapsUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export function useFields(page = 1, pageSize = 100) {
  return useQuery({
    queryKey: ["fields", { page, pageSize }],
    queryFn: () => get<ListResponse<Field>>(`${API_ROUTES.fields.list}?page=${page}&pageSize=${pageSize}`),
  });
}

export function useCreateField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFieldInput) =>
      post<ItemResponse<Field>, CreateFieldInput>(API_ROUTES.fields.list, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields"] });
    },
  });
}

export function useUpdateField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateFieldInput & { id: string }) =>
      patch<ItemResponse<Field>, UpdateFieldInput>(API_ROUTES.fields.byId(id), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields"] });
    },
  });
}

export function useDeleteField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remove<void>(API_ROUTES.fields.byId(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields"] });
    },
  });
}
