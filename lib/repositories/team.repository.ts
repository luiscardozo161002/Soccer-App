import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import type { LeagueCategory } from "@/app/generated/prisma/client";

export const teamRepository = {
  // LeagueCategory is declared Primera/Ascenso/Segunda, and Postgres orders
  // enums by declaration — so this sorts by division with no extra logic.
  findMany({ page, pageSize, category }: { page: number; pageSize: number; category?: LeagueCategory }) {
    return prisma.team.findMany({
      where: category ? { category } : undefined,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ category: "asc" }, { name: "asc" }],
      omit: { photo: true },
    });
  },

  count(category?: LeagueCategory) {
    return prisma.team.count({ where: category ? { category } : undefined });
  },

  findById(id: string) {
    return prisma.team.findUnique({ where: { id }, omit: { photo: true } });
  },

  findByName(name: string) {
    return prisma.team.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
  },

  findPhoto(id: string) {
    return prisma.team.findUnique({ where: { id }, select: { photo: true, photoType: true } });
  },

  create(data: Prisma.TeamUncheckedCreateInput) {
    return prisma.team.create({ data, omit: { photo: true } });
  },

  update(id: string, data: Prisma.TeamUncheckedUpdateInput) {
    return prisma.team.update({ where: { id }, data, omit: { photo: true } });
  },

  delete(id: string) {
    return prisma.team.delete({ where: { id } });
  },
};
