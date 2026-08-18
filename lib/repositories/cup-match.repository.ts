import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import type { CreateCupMatchDto, ListCupMatchesQuery, UpdateCupMatchDto } from "@/lib/validation/cup-match.schema";

const withTeams = {
  homeTeam: { select: { id: true, name: true, category: true } },
  awayTeam: { select: { id: true, name: true, category: true } },
  field: { select: { id: true, name: true } },
} as const;

export const cupMatchRepository = {
  findMany({ cupId, round, page, pageSize }: ListCupMatchesQuery) {
    const where: Prisma.CupMatchWhereInput = { cupId, round };
    return prisma.cupMatch.findMany({
      where,
      orderBy: [{ date: "asc" }],
      include: withTeams,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  },

  count({ cupId, round }: Omit<ListCupMatchesQuery, "page" | "pageSize">) {
    const where: Prisma.CupMatchWhereInput = { cupId, round };
    return prisma.cupMatch.count({ where });
  },

  findById(id: string) {
    return prisma.cupMatch.findUnique({ where: { id }, include: withTeams });
  },

  // Used when a team withdraws: their current pending fixture (if any)
  // needs to be auto-resolved as a forfeit for the opponent.
  findScheduledForTeam(cupId: string, teamId: string) {
    return prisma.cupMatch.findMany({
      where: { cupId, status: "scheduled", OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] },
    });
  },

  findFieldConflict(fieldId: string, date: Date, time: string, excludeId?: string) {
    return prisma.cupMatch.findFirst({
      where: {
        fieldId,
        date,
        time,
        status: { in: ["scheduled", "played"] },
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
  },

  // Used by "reopen": has either team already been paired into a newer
  // match (i.e. the bracket already advanced past this result)? If so the
  // result can no longer be safely undone.
  findLaterMatchForTeams(cupId: string, teamIds: string[], after: Date, excludeId: string) {
    return prisma.cupMatch.findFirst({
      where: {
        cupId,
        id: { not: excludeId },
        createdAt: { gt: after },
        OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
      },
    });
  },

  create(data: CreateCupMatchDto) {
    return prisma.cupMatch.create({ data, include: withTeams });
  },

  update(id: string, data: UpdateCupMatchDto) {
    return prisma.cupMatch.update({ where: { id }, data, include: withTeams });
  },

  registerResult(
    id: string,
    data: { homeGoals: number; awayGoals: number; forfeit: boolean; forfeitReason: string | null }
  ) {
    return prisma.cupMatch.update({
      where: { id },
      data: { ...data, status: "played", resultLocked: true },
      include: withTeams,
    });
  },

  delete(id: string) {
    return prisma.cupMatch.delete({ where: { id } });
  },
};
