import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import type { LeagueCategory } from "@/app/generated/prisma/client";

function playerWhere(teamId?: string, category?: LeagueCategory): Prisma.PlayerWhereInput | undefined {
  if (!teamId && !category) return undefined;
  return {
    ...(teamId ? { teamId } : {}),
    ...(category ? { team: { category } } : {}),
  };
}

export const playerRepository = {
  findMany({
    page,
    pageSize,
    teamId,
    category,
  }: {
    page: number;
    pageSize: number;
    teamId?: string;
    category?: LeagueCategory;
  }) {
    return prisma.player.findMany({
      where: playerWhere(teamId, category),
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
      omit: { photo: true },
    });
  },

  count(teamId?: string, category?: LeagueCategory) {
    return prisma.player.count({ where: playerWhere(teamId, category) });
  },

  findById(id: string) {
    return prisma.player.findUnique({ where: { id }, omit: { photo: true } });
  },

  findByRegistrationNumber(registrationNumber: string) {
    return prisma.player.findUnique({ where: { registrationNumber } });
  },

  findPhoto(id: string) {
    return prisma.player.findUnique({ where: { id }, select: { photo: true, photoType: true } });
  },

  create(data: Prisma.PlayerUncheckedCreateInput) {
    return prisma.player.create({ data, omit: { photo: true } });
  },

  update(id: string, data: Prisma.PlayerUncheckedUpdateInput) {
    return prisma.player.update({ where: { id }, data, omit: { photo: true } });
  },

  delete(id: string) {
    return prisma.player.delete({ where: { id } });
  },
};
