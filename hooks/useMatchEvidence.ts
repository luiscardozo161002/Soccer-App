"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post, remove } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import { API_ROUTES } from "@/lib/http/api-routes";

export type MatchEvidenceSlot = "front" | "back";

export interface MatchEvidence {
  id: string;
  matchId: string;
  slot: MatchEvidenceSlot;
  photoType: string;
  uploadedByUserId: string;
  createdAt: string;
}

// See playerPhotoUrl (usePlayers.ts) — here each row is its own immutable
// id, so no `?v=` cache-busting param is needed.
export function matchEvidencePhotoUrl(evidence: Pick<MatchEvidence, "matchId" | "id">) {
  return API_ROUTES.matches.evidencePhoto(evidence.matchId, evidence.id);
}

export function useMatchEvidence(matchId: string) {
  return useQuery({
    queryKey: ["matchEvidence", matchId],
    queryFn: () => get<ListResponse<MatchEvidence>>(API_ROUTES.matches.evidence(matchId)),
    enabled: !!matchId,
  });
}

export function useUploadMatchEvidence(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slot, photo }: { slot: MatchEvidenceSlot; photo: string }) =>
      post<ItemResponse<MatchEvidence>, { slot: MatchEvidenceSlot; photo: string }>(
        API_ROUTES.matches.evidence(matchId),
        { slot, photo }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matchEvidence", matchId] });
    },
  });
}

export function useDeleteMatchEvidence(matchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (evidenceId: string) => remove<void>(API_ROUTES.matches.evidenceById(matchId, evidenceId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matchEvidence", matchId] });
    },
  });
}
