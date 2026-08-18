"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/http/endpoints";
import type { ItemResponse } from "@/lib/http/types";
import { API_ROUTES } from "@/lib/http/api-routes";

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
    queryFn: () => get<ItemResponse<AuthUser>>(API_ROUTES.auth.me),
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { username: string; password: string }) =>
      post<ItemResponse<AuthUser>, typeof input>(API_ROUTES.auth.login, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => post<ItemResponse<null>, Record<string, never>>(API_ROUTES.auth.logout, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: { identifier: string }) =>
      post<ItemResponse<{ resetUrl: string | null }>, typeof input>(API_ROUTES.auth.forgotPassword, input),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: { token: string; password: string }) =>
      post<ItemResponse<null>, typeof input>(API_ROUTES.auth.resetPassword, input),
  });
}
