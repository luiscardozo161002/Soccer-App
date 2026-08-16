"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/http/endpoints";
import type { ItemResponse } from "@/lib/http/types";

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  photoType: string | null;
  photoUpdatedAt: string | null;
}

export function useMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => get<ItemResponse<AuthUser>>("/api/v1/auth/me"),
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { username: string; password: string }) =>
      post<ItemResponse<AuthUser>, typeof input>("/api/v1/auth/login", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => post<ItemResponse<null>, Record<string, never>>("/api/v1/auth/logout", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: { identifier: string }) =>
      post<ItemResponse<{ resetUrl: string | null }>, typeof input>("/api/v1/auth/forgot-password", input),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: { token: string; password: string }) =>
      post<ItemResponse<null>, typeof input>("/api/v1/auth/reset-password", input),
  });
}
