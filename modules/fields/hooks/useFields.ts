"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { fieldApi, googleMapsUrl } from "../client/field.api";
import type { CreateFieldInput, FieldFilters, UpdateFieldInput } from "../field.types";

export { googleMapsUrl };
export type { CreateFieldInput, Field, FieldFilters, UpdateFieldInput } from "../field.types";

export function useFields(page = 1, pageSize = 100) {
  const filters: FieldFilters = { page, pageSize };
  return useQuery({
    queryKey: queryKeys.fields.list(filters),
    queryFn: () => fieldApi.list(filters),
  });
}

export function useCreateField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFieldInput) => fieldApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.fields.all }),
  });
}

export function useUpdateField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateFieldInput & { id: string }) => fieldApi.update(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.fields.all }),
  });
}

export function useDeleteField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fieldApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.fields.all }),
  });
}
