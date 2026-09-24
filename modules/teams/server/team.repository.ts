import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import type { LeagueCategoryValue } from "@/lib/constants/league-categories";

export interface TeamWriteData {
  name?: string;
  registeredAt?: Date;
  category?: LeagueCategoryValue;
  folioPrefix?: string;
  photo?: Uint8Array<ArrayBuffer> | null;
  photoType?: string | null;
  photoUpdatedAt?: Date;
}

function teamWhere(category?: LeagueCategoryValue) {
  return category ? ({ category } satisfies Prisma.TeamWhereInput) : undefined;
}

export const teamRepository = {
  findMany({ page, pageSize, category }: { page: number; pageSize: number; category?: LeagueCategoryValue }) {
    return prisma.team.findMany({
      where: teamWhere(category),
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ category: "asc" }, { name: "asc" }],
      omit: { photo: true },
    });
  },

  count(category?: LeagueCategoryValue) {
    return prisma.team.count({ where: teamWhere(category) });
  },

  findById(id: string) {
    return prisma.team.findUnique({ where: { id }, omit: { photo: true } });
  },

  findByName(name: string) {
    return prisma.team.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
  },

  findByFolioPrefix(folioPrefix: string) {
    return prisma.team.findUnique({ where: { folioPrefix } });
  },

  findPhoto(id: string) {
    return prisma.team.findUnique({ where: { id }, select: { photo: true, photoType: true } });
  },

  create(data: TeamWriteData & { name: string; folioPrefix: string }) {
    const createData: Prisma.TeamUncheckedCreateInput = data;
    return prisma.team.create({ data: createData, omit: { photo: true } });
  },

  update(id: string, data: TeamWriteData) {
    const updateData: Prisma.TeamUncheckedUpdateInput = data;
    return prisma.team.update({ where: { id }, data: updateData, omit: { photo: true } });
  },

  delete(id: string) {
    return prisma.team.delete({ where: { id } });
  },
};
