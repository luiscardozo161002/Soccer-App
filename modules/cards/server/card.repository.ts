import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import type { CreateCardDto, ListCardsQuery, UpdateCardDto } from "../card.schema";

const withDetails = {
  player: { select: { id: true, name: true, team: { select: { id: true, name: true, category: true } } } },
  match: {
    select: {
      id: true,
      matchday: true,
      date: true,
      resultLocked: true,
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
    },
  },
} as const;

function buildWhere({ playerId, matchId, type, paid, category, search }: Omit<ListCardsQuery, "page" | "pageSize">) {
  return {
    playerId,
    matchId,
    type,
    paid,
    ...(category ? { player: { team: { category } } } : {}),
    ...(search
      ? {
          OR: [
            { detail: { contains: search, mode: "insensitive" } },
            { player: { name: { contains: search, mode: "insensitive" } } },
            { player: { team: { name: { contains: search, mode: "insensitive" } } } },
          ],
        }
      : {}),
  } satisfies Prisma.CardWhereInput;
}

function updatePayment(id: string, paid: boolean) {
  return prisma.$transaction(async (tx) => {
    const card = await tx.card.update({ where: { id }, data: { paid }, include: withDetails });
    if (paid) {
      await tx.sanction.updateMany({
        where: { cardId: id, fulfilled: false },
        data: { fulfilled: true, waivedByPayment: true },
      });
    } else {
      const waived = await tx.sanction.findMany({
        where: { cardId: id, waivedByPayment: true },
        select: { id: true, matchesSuspended: true, _count: { select: { appliedMatches: true } } },
      });
      for (const sanction of waived) {
        await tx.sanction.update({
          where: { id: sanction.id },
          data: {
            fulfilled: sanction._count.appliedMatches >= sanction.matchesSuspended,
            waivedByPayment: false,
          },
        });
      }
    }
    return card;
  });
}

export const cardRepository = {
  findMany(query: ListCardsQuery) {
    return prisma.card.findMany({
      where: buildWhere(query),
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { recordedAt: "desc" },
      include: withDetails,
    });
  },
  count(query: Omit<ListCardsQuery, "page" | "pageSize">) {
    return prisma.card.count({ where: buildWhere(query) });
  },
  findById(id: string) {
    return prisma.card.findUnique({ where: { id }, include: withDetails });
  },
  create(data: CreateCardDto & { amount: Prisma.Decimal; matchday: number }) {
    const { matchesSuspended, matchday, ...cardData } = data;
    return prisma.$transaction(async (tx) => {
      const card = await tx.card.create({ data: cardData });
      if (matchesSuspended !== undefined) {
        await tx.sanction.create({
          data: {
            cardId: card.id,
            matchdayStart: matchday + 1,
            matchdayEnd: matchday + matchesSuspended,
            matchesSuspended,
          },
        });
      }
      return card;
    });
  },
  update(id: string, data: UpdateCardDto) {
    return data.paid === undefined
      ? prisma.card.update({ where: { id }, data, include: withDetails })
      : updatePayment(id, data.paid);
  },
  pay(id: string) {
    return updatePayment(id, true);
  },
  delete(id: string) {
    return prisma.$transaction(async (tx) => {
      const sanction = await tx.sanction.findUnique({
        where: { cardId: id },
        select: { id: true, _count: { select: { appliedMatches: true } } },
      });
      if (sanction?._count.appliedMatches) {
        throw new ApiError(409, "SANCTION_ALREADY_APPLIED", "No se puede eliminar una tarjeta cuya suspensión ya se aplicó");
      }
      if (sanction) await tx.sanction.delete({ where: { id: sanction.id } });
      return tx.card.delete({ where: { id } });
    });
  },
};
