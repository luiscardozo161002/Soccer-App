import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import type {
  CreateMatchDto,
  ListMatchesQuery,
  RegisterResultDto,
  UpdateMatchDto,
} from "@/lib/validation/match.schema";

export const matchRepository = {
  findMany({ page, pageSize, matchday, teamId, status }: ListMatchesQuery) {
    const where: Prisma.MatchWhereInput = {
      matchday,
      status,
      ...(teamId ? { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] } : {}),
    };

    return prisma.match.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ matchday: "asc" }, { date: "asc" }],
    });
  },

  count({ matchday, teamId, status }: Omit<ListMatchesQuery, "page" | "pageSize">) {
    const where: Prisma.MatchWhereInput = {
      matchday,
      status,
      ...(teamId ? { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] } : {}),
    };
    return prisma.match.count({ where });
  },

  findById(id: string) {
    return prisma.match.findUnique({ where: { id } });
  },

  findFieldConflict(fieldId: string, date: Date, time: string, excludeId?: string) {
    return prisma.match.findFirst({
      where: { fieldId, date, time, id: excludeId ? { not: excludeId } : undefined },
    });
  },

  create(data: CreateMatchDto) {
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
        status: "played",
      },
    });
  },

  delete(id: string) {
    return prisma.match.delete({ where: { id } });
  },
};
