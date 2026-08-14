"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post } from "@/lib/http/endpoints";
import type { ItemResponse } from "@/lib/http/types";
import type { Season } from "@/hooks/useSeasons";

export function useResetTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => post<ItemResponse<Season>, Record<string, never>>("/api/v1/tournament/reset", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["standings"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
    },
  });
}
