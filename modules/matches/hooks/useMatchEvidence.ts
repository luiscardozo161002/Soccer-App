"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { matchEvidenceApi, matchEvidencePhotoUrl } from "../client/match-evidence.api";
import type { UploadMatchEvidenceInput } from "../match-evidence.types";

export { matchEvidencePhotoUrl };
export type { MatchEvidence, MatchEvidenceSlot } from "../match-evidence.types";

export function useMatchEvidence(matchId: string) {
  return useQuery({
    queryKey: queryKeys.matchEvidence.byMatch(matchId),
    queryFn: () => matchEvidenceApi.list(matchId),
    enabled: !!matchId,
  });
}

export function useUploadMatchEvidence(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadMatchEvidenceInput) => matchEvidenceApi.upload(matchId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.matchEvidence.byMatch(matchId) }),
  });
}

export function useDeleteMatchEvidence(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (evidenceId: string) => matchEvidenceApi.remove(matchId, evidenceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.matchEvidence.byMatch(matchId) }),
  });
}
