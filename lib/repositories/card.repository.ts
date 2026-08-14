import { prisma } from "@/lib/prisma";
import type { CreateCardDto, ListCardsQuery, UpdateCardDto } from "@/lib/validation/card.schema";

// select (not include) so binary photo columns never get pulled into
// this response — those are served separately via the photo endpoints.
const withDetails = {
  player: {
    select: {
      id: true,
      name: true,
      team: { select: { id: true, name: true, category: true } },
    },
  },
  match: {
    select: {
      id: true,
      matchday: true,
      date: true,
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
    },
  },
} as const;

export const cardRepository = {
  findMany({ page, pageSize, playerId, matchId }: ListCardsQuery) {
    return prisma.card.findMany({
      where: { playerId, matchId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { recordedAt: "desc" },
      include: withDetails,
    });
  },

  count({ playerId, matchId }: Omit<ListCardsQuery, "page" | "pageSize">) {
    return prisma.card.count({ where: { playerId, matchId } });
  },

  findById(id: string) {
    return prisma.card.findUnique({ where: { id }, include: withDetails });
  },

  create(data: CreateCardDto) {
    return prisma.card.create({ data });
  },

  update(id: string, data: UpdateCardDto) {
    return prisma.card.update({ where: { id }, data });
  },

  pay(id: string) {
    return prisma.card.update({ where: { id }, data: { paid: true } });
  },

  delete(id: string) {
    return prisma.card.delete({ where: { id } });
  },
};
