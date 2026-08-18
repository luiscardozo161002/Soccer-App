import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { cupEntryRepository } from "@/lib/repositories/cup-entry.repository";
import { cupMatchRepository } from "@/lib/repositories/cup-match.repository";
import type { CreateCupEntriesDto, WithdrawCupEntryDto } from "@/lib/validation/cup-entry.schema";

// Same fixed forfeit score the league's register-result form applies
// (components/register-result-form.tsx's applyForfeitScore) — kept
// consistent so a Copa walkover reads the same way as a Liga one.
// CUP_FORFEIT_WINNER_SCORE is configurable via env; the losing side is
// always 0, so that half doesn't need its own variable.
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
      throw new ApiError(404, "CUP_ENTRY_NOT_FOUND", `No cup entry exists with id ${id}`);
    }
    return entry;
  },

  addTeams(dto: CreateCupEntriesDto) {
    return cupEntryRepository.createMany(dto.cupId, dto.teamIds);
  },

  // Core of the withdrawal requirement: mark the team out of the cup, and
  // auto-resolve any match they still had pending as a default win for
  // whoever they were scheduled against — both in one transaction so a
  // failure partway through never leaves the bracket half-updated.
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
