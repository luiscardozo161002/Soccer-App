import { ApiError, notFoundError } from "@/lib/errors";
import type { CreateCardReasonConfigDto, ListCardReasonConfigsQuery, UpdateCardReasonConfigDto } from "../card-reason-config.schema";
import { cardReasonConfigRepository } from "./card-reason-config.repository";

async function getCardReasonConfigById(id: string) {
  const config = await cardReasonConfigRepository.findById(id);
  if (!config) throw notFoundError("CARD_REASON_CONFIG_NOT_FOUND", "el motivo", id);
  return config;
}

export const cardReasonConfigService = {
  async list(query: ListCardReasonConfigsQuery) {
    const [items, totalItems] = await Promise.all([
      cardReasonConfigRepository.findMany(query),
      cardReasonConfigRepository.count(query),
    ]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) };
  },
  getById: getCardReasonConfigById,
  async create(dto: CreateCardReasonConfigDto) {
    const existing = await cardReasonConfigRepository.findActiveByTypeAndReason(dto.cardType, dto.reason);
    if (existing) throw new ApiError(409, "CARD_REASON_CONFIG_EXISTS", "Ya existe un motivo con ese nombre para ese tipo de tarjeta");
    return cardReasonConfigRepository.create(dto);
  },
  async update(id: string, dto: UpdateCardReasonConfigDto) {
    await getCardReasonConfigById(id);
    return cardReasonConfigRepository.update(id, dto);
  },
};
