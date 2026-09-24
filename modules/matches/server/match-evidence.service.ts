import { ApiError, notFoundError } from "@/lib/errors";
import { optimizeEvidenceImageFromDataUrl } from "@/lib/utils/match-evidence-images";
import type { UploadMatchEvidenceDto } from "../match-evidence.schema";
import { matchEvidenceRepository } from "./match-evidence.repository";
import { matchService } from "./match.service";

export const matchEvidenceService = {
  async listForMatch(matchId: string) {
    await matchService.getById(matchId);
    return matchEvidenceRepository.findByMatchId(matchId);
  },
  async upload(matchId: string, dto: UploadMatchEvidenceDto, uploadedByUserId: string, isAdmin: boolean) {
    const match = await matchService.getById(matchId);
    if (match.resultLocked && !isAdmin) {
      throw new ApiError(409, "MATCH_RESULT_LOCKED", "El resultado de este partido ya fue confirmado: la evidencia ya no se puede modificar");
    }
    const { buffer, type } = await optimizeEvidenceImageFromDataUrl(dto.photo);
    return matchEvidenceRepository.upsert({
      matchId,
      slot: dto.slot,
      photo: Uint8Array.from(buffer),
      photoType: type,
      uploadedByUserId,
    });
  },
  async remove(matchId: string, id: string, isAdmin: boolean) {
    const match = await matchService.getById(matchId);
    if (match.resultLocked && !isAdmin) {
      throw new ApiError(409, "MATCH_RESULT_LOCKED", "El resultado de este partido ya fue confirmado: la evidencia ya no se puede borrar");
    }
    const evidence = await matchEvidenceRepository.findById(id);
    if (!evidence || evidence.matchId !== matchId) {
      throw notFoundError("MATCH_EVIDENCE_NOT_FOUND", "la evidencia", id);
    }
    await matchEvidenceRepository.delete(id);
  },
};
