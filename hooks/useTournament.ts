"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post } from "@/lib/http/endpoints";
import type { ItemResponse } from "@/lib/http/types";
import { API_ROUTES } from "@/lib/http/api-routes";
import type { Season } from "@/hooks/useSeasons";

export function useResetTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => post<ItemResponse<Season>, Record<string, never>>(API_ROUTES.tournament.reset, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["standings"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
    },
  });
}
