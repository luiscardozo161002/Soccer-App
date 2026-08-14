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

  create(data: { name: string }) {
    return prisma.season.create({ data });
  },

  archive(id: string) {
    return prisma.season.update({ where: { id }, data: { status: "archived", endDate: new Date() } });
  },
};
