import { notFoundError } from "@/lib/errors";
import { optimizeEvidenceImageFromDataUrl } from "@/lib/utils/match-evidence-images";
import type { UploadMatchEvidenceDto } from "../match-evidence.schema";
import { matchEvidenceRepository } from "./match-evidence.repository";
import { matchService } from "./match.service";

export const matchEvidenceService = {
  async listForMatch(matchId: string) {
    await matchService.getById(matchId);
    return matchEvidenceRepository.findByMatchId(matchId);
  },
  async upload(matchId: string, dto: UploadMatchEvidenceDto, uploadedByUserId: string) {
    await matchService.getById(matchId);
    const { buffer, type } = await optimizeEvidenceImageFromDataUrl(dto.photo);
    return matchEvidenceRepository.upsert({
      matchId,
      slot: dto.slot,
      photo: Uint8Array.from(buffer),
      photoType: type,
      uploadedByUserId,
    });
  },
  async remove(matchId: string, id: string) {
    await matchService.getById(matchId);
    const evidence = await matchEvidenceRepository.findById(id);
    if (!evidence || evidence.matchId !== matchId) {
      throw notFoundError("MATCH_EVIDENCE_NOT_FOUND", "la evidencia", id);
    }
    await matchEvidenceRepository.delete(id);
  },
};
