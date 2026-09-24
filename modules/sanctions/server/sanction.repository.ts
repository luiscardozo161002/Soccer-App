import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { CreateSanctionDto, ListSanctionsQuery, UpdateSanctionDto } from "../sanction.schema";

const withDetails = {
  card: {
    select: {
      id: true,
      type: true,
      detail: true,
      amount: true,
      player: {
        select: {
          id: true,
          name: true,
          photoType: true,
          photoUpdatedAt: true,
          team: { select: { id: true, name: true, category: true } },
        },
      },
      match: { select: { id: true, matchday: true, date: true } },
    },
  },
  _count: { select: { appliedMatches: true } },
} as const;

function buildWhere({ cardId, fulfilled, category, search }: Omit<ListSanctionsQuery, "page" | "pageSize">) {
  return {
    cardId,
    fulfilled,
    ...(category ? { card: { player: { team: { category } } } } : {}),
    ...(search
      ? {
          OR: [
            { card: { detail: { contains: search, mode: "insensitive" } } },
            { card: { player: { name: { contains: search, mode: "insensitive" } } } },
            { card: { player: { team: { name: { contains: search, mode: "insensitive" } } } } },
          ],
        }
      : {}),
  } satisfies Prisma.SanctionWhereInput;
}

export const sanctionRepository = {
  findMany(query: ListSanctionsQuery) {
    return prisma.sanction.findMany({
      where: buildWhere(query),
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { matchdayStart: "asc" },
      include: withDetails,
    });
  },
  count(query: Omit<ListSanctionsQuery, "page" | "pageSize">) {
    return prisma.sanction.count({ where: buildWhere(query) });
  },
  findById(id: string) {
    return prisma.sanction.findUnique({ where: { id }, include: withDetails });
  },
  findByCardId(cardId: string) {
    return prisma.sanction.findUnique({ where: { cardId }, select: { id: true } });
  },
  create(cardId: string, data: CreateSanctionDto) {
    return prisma.$transaction(async (tx) => {
      const card = await tx.card.findUniqueOrThrow({ where: { id: cardId }, select: { paid: true } });
      return tx.sanction.create({
        data: { ...data, cardId, fulfilled: card.paid, waivedByPayment: card.paid },
        include: withDetails,
      });
    });
  },
  update(id: string, data: UpdateSanctionDto) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.sanction.findUniqueOrThrow({
        where: { id },
        select: {
          cardId: true,
          fulfilled: true,
          waivedByPayment: true,
          matchesSuspended: true,
          _count: { select: { appliedMatches: true } },
        },
      });
      const waivedByPayment = data.waivedByPayment ?? (data.fulfilled === false ? false : current.waivedByPayment);
      const served = current._count.appliedMatches >= (data.matchesSuspended ?? current.matchesSuspended);
      const fulfilled = waivedByPayment || (data.fulfilled === false ? served : data.fulfilled ?? current.fulfilled);
      const sanction = await tx.sanction.update({
        where: { id },
        data: { ...data, fulfilled, waivedByPayment },
        include: withDetails,
      });
      if (waivedByPayment !== current.waivedByPayment) {
        await tx.card.update({ where: { id: current.cardId }, data: { paid: waivedByPayment } });
      }
      return sanction;
    });
  },
};
