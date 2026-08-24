import { prisma } from "@/lib/prisma";
import type {
  CreateCardReasonConfigDto,
  ListCardReasonConfigsQuery,
  UpdateCardReasonConfigDto,
} from "@/lib/validation/card-reason-config.schema";

export const cardReasonConfigRepository = {
  findMany({ page, pageSize, cardType, active }: ListCardReasonConfigsQuery) {
    return prisma.cardReasonConfig.findMany({
      where: { cardType, active },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ cardType: "asc" }, { reason: "asc" }],
    });
  },

  count({ cardType, active }: Omit<ListCardReasonConfigsQuery, "page" | "pageSize">) {
    return prisma.cardReasonConfig.count({ where: { cardType, active } });
  },

  findById(id: string) {
    return prisma.cardReasonConfig.findUnique({ where: { id } });
  },

  findActiveByTypeAndReason(cardType: "yellow" | "red", reason: string) {
    return prisma.cardReasonConfig.findFirst({ where: { cardType, reason, active: true } });
  },

  create(data: CreateCardReasonConfigDto) {
    return prisma.cardReasonConfig.create({ data });
  },

  update(id: string, data: UpdateCardReasonConfigDto) {
    return prisma.cardReasonConfig.update({ where: { id }, data });
  },
};
