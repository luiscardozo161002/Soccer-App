import { API_ROUTES } from "@/lib/http/api-routes";
import { get, post, remove } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import type { MatchEvidence, UploadMatchEvidenceInput } from "../match-evidence.types";

export function matchEvidencePhotoUrl(evidence: Pick<MatchEvidence, "matchId" | "id">) {
  return API_ROUTES.matches.evidencePhoto(evidence.matchId, evidence.id);
}

export const matchEvidenceApi = {
  list(matchId: string) {
    return get<ListResponse<MatchEvidence>>(API_ROUTES.matches.evidence(matchId));
  },
  upload(matchId: string, input: UploadMatchEvidenceInput) {
    return post<ItemResponse<MatchEvidence>, UploadMatchEvidenceInput>(API_ROUTES.matches.evidence(matchId), input);
  },
  remove(matchId: string, evidenceId: string) {
    return remove<void>(API_ROUTES.matches.evidenceById(matchId, evidenceId));
  },
};
