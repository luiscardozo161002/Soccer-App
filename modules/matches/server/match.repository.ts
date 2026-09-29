import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import type {
  CreateMatchDto,
  ListMatchesQuery,
  RegisterResultDto,
  UpdateMatchDto,
} from "../match.schema";

export const includeCategory = {
  homeTeam: {
    select: {
      category: true,
    },
  },
} as const;

export function mapMatch<Category, T extends { homeTeam: { category: Category } }>(match: T) {
  const { homeTeam, ...rest } = match;
  return {
    ...rest,
    category: homeTeam.category,
  };
}

function buildWhere({ matchday, teamId, status, seasonId, category, refereeId, archived }: ListMatchesQuery) {
  return {
    matchday,
    status,
    seasonId,
    refereeId,
    archived: archived ?? false,
    ...(teamId ? { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] } : {}),
    ...(category ? { homeTeam: { category } } : {}),
  } satisfies Prisma.MatchWhereInput;
}

export const matchRepository = {
  async findMany(query: ListMatchesQuery) {
    const matches = await prisma.match.findMany({
      where: buildWhere(query),
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: [{ homeTeam: { category: "asc" } }, { date: "asc" }, { matchday: "asc" }, { time: "asc" }],
      include: includeCategory,
    });

    return matches.map(mapMatch);
  },

  count(query: Omit<ListMatchesQuery, "page" | "pageSize">) {
    return prisma.match.count({ where: buildWhere({ ...query, page: 1, pageSize: 1 }) });
  },

  async findById(id: string) {
    const match = await prisma.match.findUnique({ where: { id }, include: includeCategory });
    return match ? mapMatch(match) : null;
  },

  countByField(fieldId: string) {
    return prisma.match.count({ where: { fieldId } });
  },

  findLatestMatchday(seasonId: string) {
    return prisma.match.findFirst({
      where: { seasonId },
      orderBy: { matchday: "desc" },
      select: { matchday: true, date: true },
    });
  },

  findFieldConflict(fieldId: string, date: Date, time: string, matchday: number, excludeId?: string) {
    return prisma.match.findFirst({
      where: { fieldId, date, time, matchday, id: excludeId ? { not: excludeId } : undefined },
    });
  },

  async create(data: CreateMatchDto & { seasonId: string }) {
    const match = await prisma.match.create({ data, include: includeCategory });
    return mapMatch(match);
  },

  async update(id: string, data: UpdateMatchDto) {
    const match = await prisma.match.update({ where: { id }, data, include: includeCategory });
    return mapMatch(match);
  },

  registerResult(
    id: string,
    dto: RegisterResultDto,
    audit: { actorUserId: string; isCorrection: boolean }
  ) {
    return prisma.$transaction(
      async (tx) => {
        const updated = await tx.match.update({
          where: { id },
          data: {
            homeGoals: dto.homeGoals,
            awayGoals: dto.awayGoals,
            forfeit: dto.forfeit ?? false,
            forfeitReason: dto.forfeit ? dto.forfeitReason || null : null,
            status: "played",
            resultLocked: true,
            ...(audit.isCorrection
              ? { resultEditedAt: new Date(), resultEditedById: audit.actorUserId }
              : {}),
          },
          include: includeCategory,
        });

        for (const teamId of [updated.homeTeamId, updated.awayTeamId]) {
          const sanctions = await tx.sanction.findMany({
            where: {
              fulfilled: false,
              matchdayStart: { lte: updated.matchday },
              card: { player: { teamId }, match: { seasonId: updated.seasonId } },
            },
          });

          for (const sanction of sanctions) {
            const alreadyApplied = await tx.sanctionMatch.findUnique({
              where: { sanctionId_matchId: { sanctionId: sanction.id, matchId: id } },
            });

            if (!alreadyApplied) {
              await tx.sanctionMatch.create({ data: { sanctionId: sanction.id, matchId: id } });
            }

            const appliedCount = await tx.sanctionMatch.count({ where: { sanctionId: sanction.id } });
            if (appliedCount >= sanction.matchesSuspended || updated.matchday > sanction.matchdayEnd) {
              await tx.sanction.update({
                where: { id: sanction.id },
                data: {
                  fulfilled: appliedCount >= sanction.matchesSuspended,
                  matchdayEnd: Math.max(sanction.matchdayEnd, updated.matchday),
                },
              });
            }
          }
        }

        return mapMatch(updated);
      },
      { isolationLevel: "Serializable" }
    );
  },

  async archive(id: string, archived: boolean) {
    const match = await prisma.match.update({ where: { id }, data: { archived }, include: includeCategory });
    return mapMatch(match);
  },

  delete(id: string) {
    return prisma.match.delete({ where: { id } });
  },
};
