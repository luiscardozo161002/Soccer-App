import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import type {
  CreateMatchDto,
  ListMatchesQuery,
  RegisterResultDto,
  UpdateMatchDto,
} from "@/lib/validation/match.schema";

export const matchRepository = {
  findMany({ page, pageSize, matchday, teamId, status, seasonId }: ListMatchesQuery) {
    const where: Prisma.MatchWhereInput = {
      matchday,
      status,
      seasonId,
      ...(teamId ? { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] } : {}),
    };

    return prisma.match.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      // Postgres orders enum columns by declaration order, and MatchStatus
      // is declared scheduled/played/postponed/cancelled — which happens to
      // be the display priority we want, so sorting by status groups the
      // list into those categories with no extra logic.
      orderBy: [{ status: "asc" }, { matchday: "asc" }, { date: "asc" }],
    });
  },

  count({ matchday, teamId, status, seasonId }: Omit<ListMatchesQuery, "page" | "pageSize">) {
    const where: Prisma.MatchWhereInput = {
      matchday,
      status,
      seasonId,
      ...(teamId ? { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] } : {}),
    };
    return prisma.match.count({ where });
  },

  findById(id: string) {
    return prisma.match.findUnique({ where: { id } });
  },

  countByField(fieldId: string) {
    return prisma.match.count({ where: { fieldId } });
  },

  // Scoped to matchday: the same field/date/time slot is reused week after
  // week for different jornadas (that's expected), but a field can't be
  // double-booked within the same jornada.
  findFieldConflict(fieldId: string, date: Date, time: string, matchday: number, excludeId?: string) {
    return prisma.match.findFirst({
      where: { fieldId, date, time, matchday, id: excludeId ? { not: excludeId } : undefined },
    });
  },

  create(data: CreateMatchDto & { seasonId: string }) {
    return prisma.match.create({ data });
  },

  update(id: string, data: UpdateMatchDto) {
    return prisma.match.update({ where: { id }, data });
  },

  registerResult(id: string, data: RegisterResultDto) {
    return prisma.match.update({
      where: { id },
      data: {
        homeGoals: data.homeGoals,
        awayGoals: data.awayGoals,
        forfeit: data.forfeit ?? false,
        forfeitReason: data.forfeit ? data.forfeitReason || null : null,
        status: "played",
        resultLocked: true,
      },
    });
  },

  delete(id: string) {
    return prisma.match.delete({ where: { id } });
  },
};
