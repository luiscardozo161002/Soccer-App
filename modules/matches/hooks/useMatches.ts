"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { matchApi } from "../client/match.api";
import type { CreateMatchInput, MatchFilters, RegisterResultInput, UpdateMatchInput } from "../match.types";

export type {
  CreateMatchInput,
  Match,
  MatchFilters,
  MatchStatus,
  RegisterResultInput,
  UpdateMatchInput,
} from "../match.types";

export function useMatches(filters: MatchFilters = {}) {
  return useQuery({
    queryKey: queryKeys.matches.list(filters),
    queryFn: () => matchApi.list(filters),
  });
}

export function useLatestMatchday() {
  return useQuery({
    queryKey: queryKeys.matches.latestMatchday,
    queryFn: matchApi.latestMatchday,
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMatchInput) => matchApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.matches.all }),
  });
}

export function useUpdateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMatchInput & { id: string }) => matchApi.update(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.matches.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.standings.all }),
      ]);
    },
  });
}

export function useRegisterResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterResultInput & { id: string }) => matchApi.registerResult(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.matches.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.standings.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.sanctions.all }),
      ]);
    },
  });
}

export function useArchiveMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; archived: boolean }) => matchApi.archive(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.matches.all }),
  });
}

export function useDeleteMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: matchApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.matches.all }),
  });
}
