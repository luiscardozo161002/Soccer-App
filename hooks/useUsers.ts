"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, post, remove } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import { API_ROUTES } from "@/lib/http/api-routes";
import type { EntityStatus } from "@/hooks/useTeams";
import type { CreateUserDto, UpdateUserDto } from "@/lib/validation/user.schema";

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

export type CreateUserInput = CreateUserDto;
export type UpdateUserInput = UpdateUserDto;

// See playerPhotoUrl (usePlayers.ts) for why the `v` cache-busting param is needed.
export function adminPhotoUrl(user: Pick<AdminUser, "id" | "photoType" | "photoUpdatedAt">) {
  if (!user.photoType) return null;
  const v = user.photoUpdatedAt ? new Date(user.photoUpdatedAt).getTime() : 0;
  return `${API_ROUTES.users.photo(user.id)}?v=${v}`;
}

// Default pageSize=100 keeps existing unpaginated call sites (MyProfileForm
// looking up "me" by id) working — pass an explicit smaller pageSize for a
// real paginated table (see AdminUsersTable).
export function useUsers(page = 1, pageSize = 100) {
  return useQuery({
    queryKey: ["users", { page, pageSize }],
    queryFn: () => get<ListResponse<AdminUser>>(`${API_ROUTES.users.list}?page=${page}&pageSize=${pageSize}`),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      post<ItemResponse<AdminUser>, CreateUserInput>(API_ROUTES.users.list, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateUserInput & { id: string }) =>
      patch<ItemResponse<AdminUser>, UpdateUserInput>(API_ROUTES.users.byId(id), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remove<void>(API_ROUTES.users.byId(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
