import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

export const teamRepository = {
  // Postgres orders enum columns by declaration order, and LeagueCategory is
  // declared Primera / Ascenso / Segunda — so this sorts teams by division
  // in that order (then alphabetically within each division) everywhere the
  // list is consumed, with no client-side re-sorting needed.
  findMany({ page, pageSize }: { page: number; pageSize: number }) {
    return prisma.team.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ category: "asc" }, { name: "asc" }],
      omit: { photo: true },
    });
  },

  count() {
    return prisma.team.count();
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
