"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Role } from "@/lib/auth/roles";
import { queryKeys } from "@/lib/query/query-keys";
import { adminPhotoUrl, userApi } from "../client/user.api";
import type { CreateUserInput, UpdateUserInput, UserFilters } from "../user.types";

export { adminPhotoUrl };
export type { AdminUser, CreateUserInput, UpdateUserInput, UserFilters } from "../user.types";

export function useUsers(page = 1, pageSize = 100, role?: Role) {
  const filters: UserFilters = { page, pageSize, role };
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => userApi.list(filters),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => userApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput & { id: string }) => userApi.update(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}
