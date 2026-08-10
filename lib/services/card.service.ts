import { ApiError } from "@/lib/errors";
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
      throw new ApiError(404, "CARD_NOT_FOUND", `No card exists with id ${id}`);
    }
    return card;
  },

  async create(dto: CreateCardDto) {
    const [player, match] = await Promise.all([
      playerRepository.findById(dto.playerId),
      matchRepository.findById(dto.matchId),
    ]);
    if (!player) throw new ApiError(404, "PLAYER_NOT_FOUND", `No player exists with id ${dto.playerId}`);
    if (!match) throw new ApiError(404, "MATCH_NOT_FOUND", `No match exists with id ${dto.matchId}`);

    const playsInMatch = player.teamId === match.homeTeamId || player.teamId === match.awayTeamId;
    if (!playsInMatch) {
      throw new ApiError(
        409,
        "PLAYER_NOT_IN_MATCH",
        "The player's team is not one of the two teams playing this match"
      );
    }

    return cardRepository.create(dto);
  },

  async update(id: string, dto: UpdateCardDto) {
    await this.getById(id);
    return cardRepository.update(id, dto);
  },

  async remove(id: string) {
    await this.getById(id);
    await cardRepository.delete(id);
  },
};
