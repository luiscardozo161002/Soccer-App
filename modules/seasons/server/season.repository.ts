import { prisma } from "@/lib/prisma";

export const seasonRepository = {
  findActive() {
    return prisma.season.findFirst({ where: { status: "active" }, orderBy: { startDate: "desc" } });
  },
  findAll() {
    return prisma.season.findMany({ orderBy: { startDate: "desc" } });
  },
  findById(id: string) {
    return prisma.season.findUnique({ where: { id } });
  },
  nameExists(name: string) {
    return prisma.season.findFirst({ where: { name } });
  },
  archiveAndCreate(activeSeasonId: string, name: string) {
    return prisma.$transaction(async (transaction) => {
      await transaction.season.update({
        where: { id: activeSeasonId },
        data: { status: "archived", endDate: new Date() },
      });
      return transaction.season.create({ data: { name } });
    });
  },
  update(id: string, data: { name?: string }) {
    return prisma.season.update({ where: { id }, data });
  },
};
