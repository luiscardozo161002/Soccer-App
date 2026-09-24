import { ApiError, notFoundError } from "@/lib/errors";
import { cardRepository } from "@/modules/cards/server/card.repository";
import type { CreateSanctionDto, ListSanctionsQuery, UpdateSanctionDto } from "../sanction.schema";
import { sanctionRepository } from "./sanction.repository";

async function getSanctionById(id: string) {
  const sanction = await sanctionRepository.findById(id);
  if (!sanction) throw notFoundError("SANCTION_NOT_FOUND", "la sanción", id);
  return sanction;
}

export const sanctionService = {
  async list(query: ListSanctionsQuery) {
    const [items, totalItems] = await Promise.all([sanctionRepository.findMany(query), sanctionRepository.count(query)]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) };
  },
  getById: getSanctionById,
  async createForCard(cardId: string, dto: CreateSanctionDto) {
    const card = await cardRepository.findById(cardId);
    if (!card) throw notFoundError("CARD_NOT_FOUND", "la tarjeta", cardId);
    if (card.type !== "red") throw new ApiError(409, "CARD_NOT_RED", "Solo las tarjetas rojas generan suspensión");
    if (await sanctionRepository.findByCardId(cardId)) {
      throw new ApiError(409, "CARD_ALREADY_SANCTIONED", "Esta tarjeta ya tiene una suspensión");
    }
    return sanctionRepository.create(cardId, dto);
  },
  async update(id: string, dto: UpdateSanctionDto) {
    const sanction = await getSanctionById(id);
    if (dto.fulfilled === false && sanction._count.appliedMatches >= (dto.matchesSuspended ?? sanction.matchesSuspended)) {
      throw new ApiError(409, "SANCTION_ALREADY_SERVED", "No se puede reabrir una suspensión que ya cumplió todos sus partidos");
    }
    return sanctionRepository.update(id, dto);
  },
  async payFine(id: string) {
    const sanction = await getSanctionById(id);
    if (sanction.fulfilled) throw new ApiError(409, "SANCTION_ALREADY_FULFILLED", "Esta sanción ya está cumplida");
    return sanctionRepository.update(id, { fulfilled: true, waivedByPayment: true });
  },
};
