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
  photoType: string | null;
  photoUpdatedAt: string | null;
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
  photo?: string;
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, "password" | "photo">> & {
  status?: EntityStatus;
  photo?: string | null;
};

// See playerPhotoUrl (usePlayers.ts) for why the `v` cache-busting param is needed.
export function adminPhotoUrl(user: Pick<AdminUser, "id" | "photoType" | "photoUpdatedAt">) {
  if (!user.photoType) return null;
  const v = user.photoUpdatedAt ? new Date(user.photoUpdatedAt).getTime() : 0;
  return `/api/v1/users/${user.id}/photo?v=${v}`;
}

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
