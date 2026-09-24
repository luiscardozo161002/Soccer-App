"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { sanctionApi } from "../client/sanction.api";
import { activeSanctionsByPlayer, sanctionMatchesRemaining } from "../sanction.rules";
import type { CreateSanctionInput, SanctionFilters } from "../sanction.types";

export { activeSanctionsByPlayer, sanctionMatchesRemaining };
export type { Sanction } from "../sanction.types";

export function useSanctions(fulfilled?: boolean, page = 1, pageSize = 20, extraFilters: Omit<SanctionFilters, "fulfilled" | "page" | "pageSize"> = {}) {
  const filters = { fulfilled, page, pageSize, ...extraFilters };
  return useQuery({ queryKey: queryKeys.sanctions.list(filters), queryFn: () => sanctionApi.list(filters) });
}

export function useAllActiveSanctions() {
  return useQuery({
    queryKey: [...queryKeys.sanctions.all, "all-active"],
    queryFn: async () => {
      const sanctions = [];
      let page = 1;
      let totalPages = 1;
      do {
        const response = await sanctionApi.list({ fulfilled: false, page, pageSize: 100 });
        sanctions.push(...response.data);
        totalPages = response.meta.totalPages;
        page++;
      } while (page <= totalPages);
      return sanctions;
    },
  });
}

export function useCreateSanction() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: CreateSanctionInput) => sanctionApi.create(input), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sanctions.all }) });
}

export function usePaySanction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sanctionApi.pay,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.sanctions.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.cards.all }),
      ]);
    },
  });
}

export function useRevertSanction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sanctionApi.revert,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.sanctions.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.cards.all }),
      ]);
    },
  });
}
