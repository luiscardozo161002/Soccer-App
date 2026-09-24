import { ApiError, notFoundError } from "@/lib/errors";
import { matchRepository } from "@/modules/matches/server/match.repository";
import { playerRepository } from "@/modules/players/server/player.repository";
import type { CreateCardDto, ListCardsQuery, UpdateCardDto } from "../card.schema";
import { cardReasonConfigRepository } from "./card-reason-config.repository";
import { cardRepository } from "./card.repository";

async function getCardById(id: string) {
  const card = await cardRepository.findById(id);
  if (!card) throw notFoundError("CARD_NOT_FOUND", "la tarjeta", id);
  return card;
}

export const cardService = {
  async list(query: ListCardsQuery) {
    const [items, totalItems] = await Promise.all([cardRepository.findMany(query), cardRepository.count(query)]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) };
  },
  getById: getCardById,
  async create(dto: CreateCardDto) {
    const [player, match] = await Promise.all([
      playerRepository.findById(dto.playerId),
      matchRepository.findById(dto.matchId),
    ]);
    if (!player) throw notFoundError("PLAYER_NOT_FOUND", "el jugador", dto.playerId);
    if (!match) throw notFoundError("MATCH_NOT_FOUND", "el partido", dto.matchId);
    if (match.resultLocked) {
      throw new ApiError(409, "MATCH_RESULT_LOCKED", "No se pueden agregar tarjetas a un partido confirmado");
    }
    if (player.teamId !== match.homeTeamId && player.teamId !== match.awayTeamId) {
      throw new ApiError(409, "PLAYER_NOT_IN_MATCH", "El equipo del jugador no es ninguno de los dos que juegan este partido");
    }
    const reasonConfig = await cardReasonConfigRepository.findActiveByTypeAndReason(dto.type, dto.detail);
    if (!reasonConfig) {
      throw new ApiError(422, "CARD_REASON_NOT_CONFIGURED", "Ese motivo no está configurado (o no está activo) para este tipo de tarjeta");
    }
    return cardRepository.create({ ...dto, amount: reasonConfig.amount, matchday: match.matchday });
  },
  async update(id: string, dto: UpdateCardDto) {
    await getCardById(id);
    return cardRepository.update(id, dto);
  },
  async payFine(id: string) {
    const card = await getCardById(id);
    if (card.paid) throw new ApiError(409, "CARD_ALREADY_PAID", "Esta tarjeta ya fue pagada");
    return cardRepository.pay(id);
  },
  async remove(id: string) {
    const card = await getCardById(id);
    if (card.match.resultLocked) {
      throw new ApiError(409, "MATCH_RESULT_LOCKED", "No se pueden eliminar tarjetas de un partido confirmado");
    }
    await cardRepository.delete(id);
  },
};
