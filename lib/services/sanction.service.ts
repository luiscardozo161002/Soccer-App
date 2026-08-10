import { ApiError } from "@/lib/errors";
import { sanctionRepository } from "@/lib/repositories/sanction.repository";
import { cardRepository } from "@/lib/repositories/card.repository";
import type { CreateSanctionDto, ListSanctionsQuery, UpdateSanctionDto } from "@/lib/validation/sanction.schema";

export const sanctionService = {
  async list(query: ListSanctionsQuery) {
    const [items, totalItems] = await Promise.all([
      sanctionRepository.findMany(query),
      sanctionRepository.count(query),
    ]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) };
  },

  async getById(id: string) {
    const sanction = await sanctionRepository.findById(id);
    if (!sanction) {
      throw new ApiError(404, "SANCTION_NOT_FOUND", `No sanction exists with id ${id}`);
    }
    return sanction;
  },

  async createForCard(cardId: string, dto: CreateSanctionDto) {
    const card = await cardRepository.findById(cardId);
    if (!card) {
      throw new ApiError(404, "CARD_NOT_FOUND", `No card exists with id ${cardId}`);
    }
    return sanctionRepository.create(cardId, dto);
  },

  async update(id: string, dto: UpdateSanctionDto) {
    await this.getById(id);
    return sanctionRepository.update(id, dto);
  },
};
