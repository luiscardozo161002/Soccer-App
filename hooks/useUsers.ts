"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, post, remove } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import type { EntityStatus } from "@/hooks/useTeams";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  status: EntityStatus;
  createdAt: string;
}

export interface CreateUserInput {
  username: string;
  email: string;
  phoneNumber?: string;
  password: string;
  role?: string;
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, "password">> & { status?: EntityStatus };

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => get<ListResponse<AdminUser>>("/api/v1/users?pageSize=100"),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => post<ItemResponse<AdminUser>, CreateUserInput>("/api/v1/users", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateUserInput & { id: string }) =>
      patch<ItemResponse<AdminUser>, UpdateUserInput>(`/api/v1/users/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remove<void>(`/api/v1/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
