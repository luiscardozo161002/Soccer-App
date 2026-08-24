import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import type { CreateMatchDto, ListMatchesQuery, UpdateMatchDto } from "@/lib/validation/match.schema";

export const includeCategory = {
  homeTeam: {
    select: {
      category: true,
    },
  },
} as const;

export function mapMatch<T extends { homeTeam: { category: any } }>(match: T) {
  const { homeTeam, ...rest } = match;
  return {
    ...rest,
    category: homeTeam.category,
  };
}

export const matchRepository = {
  async findMany({ page, pageSize, matchday, teamId, status, seasonId, category, refereeId }: ListMatchesQuery) {
    const where: Prisma.MatchWhereInput = {
      matchday,
      status,
      seasonId,
      refereeId,
      ...(teamId ? { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] } : {}),
      ...(category ? { homeTeam: { category } } : {}),
    };

    const matches = await prisma.match.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ status: "asc" }, { matchday: "asc" }, { date: "asc" }],
      include: includeCategory,
    });

    return matches.map(mapMatch);
  },

  count({ matchday, teamId, status, seasonId, category, refereeId }: Omit<ListMatchesQuery, "page" | "pageSize">) {
    const where: Prisma.MatchWhereInput = {
      matchday,
      status,
      seasonId,
      refereeId,
      ...(teamId ? { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] } : {}),
      ...(category ? { homeTeam: { category } } : {}),
    };
    return prisma.match.count({ where });
  },

  async findById(id: string) {
    const match = await prisma.match.findUnique({
      where: { id },
      include: includeCategory,
    });
    if (!match) return null;
    return mapMatch(match);
  },

  countByField(fieldId: string) {
    return prisma.match.count({ where: { fieldId } });
  },

  countPlayedSince(teamId: string, seasonId: string, since: Date) {
    return prisma.match.count({
      where: {
        seasonId,
        status: "played",
        date: { gt: since },
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
    });
  },

  // Scoped to matchday: the same field/date/time slot is reused week after
  // week for different jornadas (that's expected), but a field can't be
  // double-booked within the same jornada.
  findFieldConflict(fieldId: string, date: Date, time: string, matchday: number, excludeId?: string) {
    return prisma.match.findFirst({
      where: { fieldId, date, time, matchday, id: excludeId ? { not: excludeId } : undefined },
    });
  },

  async create(data: CreateMatchDto & { seasonId: string }) {
    const match = await prisma.match.create({
      data,
      include: includeCategory,
    });
    return mapMatch(match);
  },

  async update(id: string, data: UpdateMatchDto) {
    const match = await prisma.match.update({
      where: { id },
      data,
      include: includeCategory,
    });
    return mapMatch(match);
  },

  delete(id: string) {
    return prisma.match.delete({ where: { id } });
  },
};
