import { prisma } from "@/lib/prisma";
import type { CreateCardDto, ListCardsQuery, UpdateCardDto } from "@/lib/validation/card.schema";

export const cardRepository = {
  findMany({ page, pageSize, playerId, matchId }: ListCardsQuery) {
    return prisma.card.findMany({
      where: { playerId, matchId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { recordedAt: "desc" },
    });
  },

  count({ playerId, matchId }: Omit<ListCardsQuery, "page" | "pageSize">) {
    return prisma.card.count({ where: { playerId, matchId } });
  },

  findById(id: string) {
    return prisma.card.findUnique({ where: { id } });
  },

  create(data: CreateCardDto) {
    return prisma.card.create({ data });
  },

  update(id: string, data: UpdateCardDto) {
    return prisma.card.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.card.delete({ where: { id } });
  },
};
