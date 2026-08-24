import { ApiError, notFoundError } from "@/lib/errors";
import { matchEvidenceRepository } from "@/lib/repositories/match-evidence.repository";
import { matchService } from "@/lib/services/match.service";
import { optimizeEvidenceImageFromDataUrl } from "@/lib/utils/match-evidence-images";
import type { UploadMatchEvidenceDto } from "@/lib/validation/match-evidence.schema";

export const matchEvidenceService = {
  async listForMatch(matchId: string) {
    await matchService.getById(matchId);
    return matchEvidenceRepository.findByMatchId(matchId);
  },

  // Exactly one photo per slot (front/back of the cédula arbitral) —
  // uploading again to a slot that already has one is a "retake", not an
  // additional photo, so there's no separate "max photos" cap to enforce.
  // Once resultLocked, only an admin may replace evidence (e.g. the referee
  // uploaded the wrong photo) — everyone else still hits the hard lock.
  async upload(matchId: string, dto: UploadMatchEvidenceDto, uploadedByUserId: string, isAdmin: boolean) {
    const match = await matchService.getById(matchId);
    if (match.resultLocked && !isAdmin) {
      throw new ApiError(409, "MATCH_RESULT_LOCKED", "El resultado de este partido ya fue confirmado: la evidencia ya no se puede modificar");
    }
    const { buffer, type } = await optimizeEvidenceImageFromDataUrl(dto.photo);
    return matchEvidenceRepository.upsert({
      matchId,
      slot: dto.slot,
      photo: buffer,
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
