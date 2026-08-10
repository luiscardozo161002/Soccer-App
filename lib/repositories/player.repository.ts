import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

export const playerRepository = {
  findMany({ page, pageSize, teamId }: { page: number; pageSize: number; teamId?: string }) {
    return prisma.player.findMany({
      where: teamId ? { teamId } : undefined,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
      omit: { photo: true },
    });
  },

  count(teamId?: string) {
    return prisma.player.count({ where: teamId ? { teamId } : undefined });
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
