import { prisma } from "@/lib/prisma";
import type { CreateSanctionDto, ListSanctionsQuery, UpdateSanctionDto } from "@/lib/validation/sanction.schema";

export const sanctionRepository = {
  findMany({ page, pageSize, cardId, fulfilled }: ListSanctionsQuery) {
    return prisma.sanction.findMany({
      where: { cardId, fulfilled },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { matchdayStart: "asc" },
    });
  },

  count({ cardId, fulfilled }: Omit<ListSanctionsQuery, "page" | "pageSize">) {
    return prisma.sanction.count({ where: { cardId, fulfilled } });
  },

  findById(id: string) {
    return prisma.sanction.findUnique({ where: { id } });
  },

  create(cardId: string, data: CreateSanctionDto) {
    return prisma.sanction.create({ data: { ...data, cardId } });
  },

  update(id: string, data: UpdateSanctionDto) {
    return prisma.sanction.update({ where: { id }, data });
  },
};
