import { prisma } from "@/lib/prisma";
import { ApiError, notFoundError } from "@/lib/errors";
import { cupEntryRepository } from "@/lib/repositories/cup-entry.repository";
import { cupMatchRepository } from "@/lib/repositories/cup-match.repository";
import type { CreateCupEntriesDto, WithdrawCupEntryDto } from "@/lib/validation/cup-entry.schema";

// Matches the league's fixed forfeit score (register-result-form.tsx) so a
// Copa walkover reads the same as a Liga one; configurable via env.
const FORFEIT_WINNER_SCORE = Number(process.env.CUP_FORFEIT_WINNER_SCORE) || 3;
const FORFEIT_LOSER_SCORE = 0;

export const cupEntryService = {
  async list(cupId: string, page: number, pageSize: number) {
    const [items, totalItems] = await Promise.all([
      cupEntryRepository.findByCup(cupId, page, pageSize),
      cupEntryRepository.countByCup(cupId),
    ]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / pageSize) };
  },

  async getById(id: string) {
    const entry = await cupEntryRepository.findById(id);
    if (!entry) {
      throw notFoundError("CUP_ENTRY_NOT_FOUND", "la inscripción a la copa", id);
    }
    return entry;
  },

  addTeams(dto: CreateCupEntriesDto) {
    return cupEntryRepository.createMany(dto.cupId, dto.teamIds);
  },

  // One transaction: mark the team withdrawn, and auto-forfeit any pending
  // match to their scheduled opponent, so a failure partway through never
  // leaves the bracket half-updated.
  async withdraw(id: string, dto: WithdrawCupEntryDto) {
    const entry = await this.getById(id);
    if (entry.status !== "active") {
      throw new ApiError(409, "CUP_ENTRY_NOT_ACTIVE", "Este equipo ya no está activo en la copa");
    }

    const pendingMatches = await cupMatchRepository.findScheduledForTeam(entry.cupId, entry.teamId);

    return prisma.$transaction(async (tx) => {
      const withdrawn = await tx.cupEntry.update({
        where: { id },
        data: { status: "withdrawn", eliminatedReason: dto.reason, eliminatedAt: new Date() },
        include: { team: { select: { id: true, name: true, category: true } } },
      });

      for (const match of pendingMatches) {
        const withdrawingIsHome = match.homeTeamId === entry.teamId;
        await tx.cupMatch.update({
          where: { id: match.id },
          data: {
            homeGoals: withdrawingIsHome ? FORFEIT_LOSER_SCORE : FORFEIT_WINNER_SCORE,
            awayGoals: withdrawingIsHome ? FORFEIT_WINNER_SCORE : FORFEIT_LOSER_SCORE,
            forfeit: true,
            forfeitReason: dto.reason,
            status: "played",
            resultLocked: true,
          },
        });
      }

      return withdrawn;
    });
  },
};
