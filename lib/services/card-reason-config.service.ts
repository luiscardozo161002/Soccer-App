import { ApiError, notFoundError } from "@/lib/errors";
import { cardReasonConfigRepository } from "@/lib/repositories/card-reason-config.repository";
import type {
  CreateCardReasonConfigDto,
  ListCardReasonConfigsQuery,
  UpdateCardReasonConfigDto,
} from "@/lib/validation/card-reason-config.schema";

export const cardReasonConfigService = {
  async list(query: ListCardReasonConfigsQuery) {
    const [items, totalItems] = await Promise.all([
      cardReasonConfigRepository.findMany(query),
      cardReasonConfigRepository.count(query),
    ]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) };
  },

  async getById(id: string) {
    const config = await cardReasonConfigRepository.findById(id);
    if (!config) throw notFoundError("CARD_REASON_CONFIG_NOT_FOUND", "el motivo", id);
    return config;
  },

  async create(dto: CreateCardReasonConfigDto) {
    const existing = await cardReasonConfigRepository.findActiveByTypeAndReason(dto.cardType, dto.reason);
    if (existing) {
      throw new ApiError(409, "CARD_REASON_CONFIG_EXISTS", "Ya existe un motivo con ese nombre para ese tipo de tarjeta");
    }
    return cardReasonConfigRepository.create(dto);
  },

  async update(id: string, dto: UpdateCardReasonConfigDto) {
    await this.getById(id);
    return cardReasonConfigRepository.update(id, dto);
  },
};
