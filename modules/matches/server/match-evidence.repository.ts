import { prisma } from "@/lib/prisma";
import type { MatchEvidenceSlot } from "../match-evidence.types";

const publicSelect = {
  id: true,
  matchId: true,
  slot: true,
  photoType: true,
  uploadedByUserId: true,
  createdAt: true,
} as const;

interface EvidenceWriteData {
  matchId: string;
  slot: MatchEvidenceSlot;
  photo: Uint8Array<ArrayBuffer>;
  photoType: string;
  uploadedByUserId: string;
}

export const matchEvidenceRepository = {
  findByMatchId(matchId: string) {
    return prisma.matchEvidence.findMany({ where: { matchId }, select: publicSelect, orderBy: { slot: "desc" } });
  },
  findById(id: string) {
    return prisma.matchEvidence.findUnique({ where: { id }, select: publicSelect });
  },
  findPhoto(id: string) {
    return prisma.matchEvidence.findUnique({ where: { id }, select: { matchId: true, photo: true, photoType: true } });
  },
  upsert({ matchId, slot, ...data }: EvidenceWriteData) {
    return prisma.matchEvidence.upsert({
      where: { matchId_slot: { matchId, slot } },
      create: { matchId, slot, ...data },
      update: data,
      select: publicSelect,
    });
  },
  delete(id: string) {
    return prisma.matchEvidence.delete({ where: { id } });
  },
};
