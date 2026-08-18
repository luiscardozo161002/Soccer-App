import { prisma } from "@/lib/prisma";

export const cupRepository = {
  findAll() {
    return prisma.cup.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { entries: true, matches: true } } },
    });
  },

  findById(id: string) {
    return prisma.cup.findUnique({ where: { id } });
  },

  create(data: { name: string }) {
    return prisma.cup.create({ data });
  },
};
