"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { markLoggingOut, clearLoggingOut } from "@/lib/auth/client-session";
import { authApi } from "../client/auth.api";
import type { ForgotPasswordInput, LoginInput, ResetPasswordInput } from "../auth.types";

export type { AuthUser } from "../auth.types";

export function useMe() {
  return useQuery({ queryKey: queryKeys.auth.me, queryFn: authApi.me, retry: false, refetchInterval: 60_000 });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: LoginInput) => authApi.login(input), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.all }) });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onMutate: () => markLoggingOut(),
    onSuccess: () => queryClient.removeQueries({ queryKey: queryKeys.auth.all }),
    onError: () => clearLoggingOut(),
  });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: (input: ForgotPasswordInput) => authApi.forgotPassword(input) });
}

export function useResetPassword() {
  return useMutation({ mutationFn: (input: ResetPasswordInput) => authApi.resetPassword(input) });
}
