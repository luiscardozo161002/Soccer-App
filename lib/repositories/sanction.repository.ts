import { prisma } from "@/lib/prisma";
import type { CreateSanctionDto, ListSanctionsQuery, UpdateSanctionDto } from "@/lib/validation/sanction.schema";

// select (not include) so binary photo columns never get pulled into
// this response — those are served separately via the photo endpoints.
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
          team: { select: { id: true, name: true, category: true } },
        },
      },
      match: { select: { id: true, matchday: true, date: true } },
    },
  },
} as const;

export const sanctionRepository = {
  findMany({ page, pageSize, cardId, fulfilled }: ListSanctionsQuery) {
    return prisma.sanction.findMany({
      where: { cardId, fulfilled },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { matchdayStart: "asc" },
      include: withDetails,
    });
  },

  count({ cardId, fulfilled }: Omit<ListSanctionsQuery, "page" | "pageSize">) {
    return prisma.sanction.count({ where: { cardId, fulfilled } });
  },

  findById(id: string) {
    return prisma.sanction.findUnique({ where: { id }, include: withDetails });
  },

  create(cardId: string, data: CreateSanctionDto) {
    return prisma.sanction.create({ data: { ...data, cardId } });
  },

  update(id: string, data: UpdateSanctionDto) {
    return prisma.sanction.update({ where: { id }, data });
  },
};
