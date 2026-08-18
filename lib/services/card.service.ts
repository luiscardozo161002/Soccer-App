import { ApiError, notFoundError } from "@/lib/errors";
import { cardRepository } from "@/lib/repositories/card.repository";
import { playerRepository } from "@/lib/repositories/player.repository";
import { matchRepository } from "@/lib/repositories/match.repository";
import type { CreateCardDto, ListCardsQuery, UpdateCardDto } from "@/lib/validation/card.schema";

export const cardService = {
  async list(query: ListCardsQuery) {
    const [items, totalItems] = await Promise.all([
      cardRepository.findMany(query),
      cardRepository.count(query),
    ]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) };
  },

  async getById(id: string) {
    const card = await cardRepository.findById(id);
    if (!card) {
      throw notFoundError("CARD_NOT_FOUND", "la tarjeta", id);
    }
    return card;
  },

  async create(dto: CreateCardDto) {
    const [player, match] = await Promise.all([
      playerRepository.findById(dto.playerId),
      matchRepository.findById(dto.matchId),
    ]);
    if (!player) throw notFoundError("PLAYER_NOT_FOUND", "el jugador", dto.playerId);
    if (!match) throw notFoundError("MATCH_NOT_FOUND", "el partido", dto.matchId);

    const playsInMatch = player.teamId === match.homeTeamId || player.teamId === match.awayTeamId;
    if (!playsInMatch) {
      throw new ApiError(409, "PLAYER_NOT_IN_MATCH", "El equipo del jugador no es ninguno de los dos que juegan este partido");
    }

    return cardRepository.create(dto);
  },

  async update(id: string, dto: UpdateCardDto) {
    await this.getById(id);
    return cardRepository.update(id, dto);
  },

  async payFine(id: string) {
    const card = await this.getById(id);
    if (card.paid) {
      throw new ApiError(409, "CARD_ALREADY_PAID", "Esta tarjeta ya fue pagada");
    }
    return cardRepository.pay(id);
  },

  async remove(id: string) {
    await this.getById(id);
    await cardRepository.delete(id);
  },
};
