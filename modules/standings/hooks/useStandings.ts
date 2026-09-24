"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { standingsApi } from "../client/standings.api";

export type { StandingsRow } from "../standings.types";

export function useStandings(seasonId?: string) {
  return useQuery({
    queryKey: queryKeys.standings.list(seasonId ?? "active"),
    queryFn: () => standingsApi.list(seasonId),
  });
}
