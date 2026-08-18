import { prisma } from "@/lib/prisma";

const withTeam = {
  team: { select: { id: true, name: true, category: true } },
} as const;

export const cupEntryRepository = {
  findByCup(cupId: string, page: number, pageSize: number) {
    return prisma.cupEntry.findMany({
      where: { cupId },
      include: withTeam,
      orderBy: { team: { name: "asc" } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  },

  countByCup(cupId: string) {
    return prisma.cupEntry.count({ where: { cupId } });
  },

  findById(id: string) {
    return prisma.cupEntry.findUnique({ where: { id }, include: withTeam });
  },

  findByCupAndTeam(cupId: string, teamId: string) {
    return prisma.cupEntry.findUnique({ where: { cupId_teamId: { cupId, teamId } } });
  },

  // skipDuplicates lets the caller pass the full desired roster each time
  // without pre-checking who's already in — the @@unique([cupId, teamId])
  // constraint does the deduplication at the DB level.
  createMany(cupId: string, teamIds: string[]) {
    return prisma.cupEntry.createMany({
      data: teamIds.map((teamId) => ({ cupId, teamId })),
      skipDuplicates: true,
    });
  },

  eliminate(id: string, reason: string) {
    return prisma.cupEntry.update({
      where: { id },
      data: { status: "eliminated", eliminatedReason: reason, eliminatedAt: new Date() },
    });
  },
};
