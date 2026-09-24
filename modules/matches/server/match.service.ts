import { ApiError, notFoundError } from "@/lib/errors";
import { fieldRepository } from "@/modules/fields/server/field.repository";
import { cardRepository } from "@/modules/cards/server/card.repository";
import { teamRepository } from "@/modules/teams/server/team.repository";
import { seasonService } from "@/modules/seasons/server/season.service";
import type { CreateMatchDto, ListMatchesQuery, RegisterResultDto, UpdateMatchDto } from "../match.schema";
import { matchRepository } from "./match.repository";
import { assertMatchDateNotBefore, toMatchDateTime } from "./match.rules";

async function getMatchById(id: string) {
  const match = await matchRepository.findById(id);
  if (!match) throw notFoundError("MATCH_NOT_FOUND", "el partido", id);
  return match;
}

export const matchService = {
  async getLatestMatchday() {
    const activeSeason = await seasonService.getActive();
    return matchRepository.findLatestMatchday(activeSeason.id);
  },

  async list(query: ListMatchesQuery) {
    const seasonId = query.seasonId ?? (await seasonService.getActive()).id;
    const resolvedQuery = { ...query, seasonId };
    const [items, totalItems] = await Promise.all([
      matchRepository.findMany(resolvedQuery),
      matchRepository.count(resolvedQuery),
    ]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) };
  },

  getById: getMatchById,

  async create(dto: CreateMatchDto) {
    const [homeTeam, awayTeam, field] = await Promise.all([
      teamRepository.findById(dto.homeTeamId),
      teamRepository.findById(dto.awayTeamId),
      fieldRepository.findById(dto.fieldId),
    ]);
    if (!homeTeam) throw notFoundError("TEAM_NOT_FOUND", "el equipo", dto.homeTeamId);
    if (!awayTeam) throw notFoundError("TEAM_NOT_FOUND", "el equipo", dto.awayTeamId);
    if (!field) throw notFoundError("FIELD_NOT_FOUND", "la cancha", dto.fieldId);

    if (homeTeam.category !== awayTeam.category) {
      throw new ApiError(
        409,
        "CATEGORY_MISMATCH",
        "Los dos equipos deben pertenecer a la misma categoría/división"
      );
    }

    assertMatchDateNotBefore(dto.date);

    if (dto.time) {
      const conflict = await matchRepository.findFieldConflict(dto.fieldId, dto.date, dto.time, dto.matchday);
      if (conflict) {
        throw new ApiError(
          409,
          "FIELD_ALREADY_BOOKED",
          "La cancha ya tiene otro partido en esa jornada, fecha y hora"
        );
      }
    }

    const activeSeason = await seasonService.getActive();
    return matchRepository.create({ ...dto, seasonId: activeSeason.id });
  },

  async update(id: string, dto: UpdateMatchDto) {
    const match = await getMatchById(id);

    if (match.resultLocked) {
      throw new ApiError(
        409,
        "MATCH_RESULT_LOCKED",
        "Este partido ya fue jugado y su resultado fue confirmado: ya no se puede editar"
      );
    }

    const homeTeamId = dto.homeTeamId ?? match.homeTeamId;
    const awayTeamId = dto.awayTeamId ?? match.awayTeamId;
    const participantsChanged = homeTeamId !== match.homeTeamId || awayTeamId !== match.awayTeamId;
    if (participantsChanged) {
      if (match.status !== "scheduled") {
        throw new ApiError(409, "MATCH_TEAMS_LOCKED", "Solo se pueden cambiar los equipos de un partido Programado");
      }
      if (homeTeamId === awayTeamId) {
        throw new ApiError(422, "MATCH_TEAMS_EQUAL", "El local y el visitante deben ser distintos");
      }
      const [homeTeam, awayTeam, cardsCount] = await Promise.all([
        teamRepository.findById(homeTeamId),
        teamRepository.findById(awayTeamId),
        cardRepository.count({ matchId: id }),
      ]);
      if (!homeTeam) throw notFoundError("TEAM_NOT_FOUND", "el equipo", homeTeamId);
      if (!awayTeam) throw notFoundError("TEAM_NOT_FOUND", "el equipo", awayTeamId);
      if (homeTeam.category !== awayTeam.category) {
        throw new ApiError(409, "CATEGORY_MISMATCH", "Los dos equipos deben pertenecer a la misma categoría/división");
      }
      if (cardsCount > 0) {
        throw new ApiError(409, "MATCH_HAS_CARDS", "No se pueden cambiar los equipos de un partido que ya tiene tarjetas registradas");
      }
    }

    if (dto.fieldId) {
      const field = await fieldRepository.findById(dto.fieldId);
      if (!field) throw notFoundError("FIELD_NOT_FOUND", "la cancha", dto.fieldId);
    }

    const resultingStatus = dto.status ?? match.status;
    if (dto.date && resultingStatus === "scheduled") assertMatchDateNotBefore(dto.date);

    if (resultingStatus === "postponed" || resultingStatus === "cancelled") {
      const resultingReason = dto.statusReason ?? match.statusReason;
      if (!resultingReason?.trim()) {
        throw new ApiError(
          422,
          "STATUS_REASON_REQUIRED",
          resultingStatus === "postponed"
            ? "Indica el motivo por el que se pospone el partido"
            : "Indica el motivo por el que se cancela el partido"
        );
      }
    }

    const effectiveTime = dto.time ?? match.time;
    if (effectiveTime && (dto.fieldId || dto.date || dto.time || dto.matchday)) {
      const conflict = await matchRepository.findFieldConflict(
        dto.fieldId ?? match.fieldId,
        dto.date ?? match.date,
        effectiveTime,
        dto.matchday ?? match.matchday,
        id
      );
      if (conflict) {
        throw new ApiError(
          409,
          "FIELD_ALREADY_BOOKED",
          "La cancha ya tiene otro partido en esa jornada, fecha y hora"
        );
      }
    }

    return matchRepository.update(id, dto);
  },

  async registerResult(id: string, dto: RegisterResultDto, actor: { userId: string; isAdmin: boolean }) {
    const match = await getMatchById(id);
    const isCorrection = match.resultLocked;

    if (isCorrection && !actor.isAdmin) {
      throw new ApiError(
        409,
        "MATCH_RESULT_LOCKED",
        "El resultado de este partido ya fue confirmado y no se puede modificar"
      );
    }
    if (!match.time) {
      throw new ApiError(
        409,
        "MATCH_TIME_REQUIRED",
        "Este partido no tiene hora registrada. Edítalo para agregar la hora antes de registrar el resultado"
      );
    }
    if (match.status === "scheduled" && toMatchDateTime(match.date, match.time) > new Date()) {
      throw new ApiError(
        409,
        "MATCH_NOT_STARTED",
        "No se puede registrar el resultado antes de la hora programada del partido"
      );
    }

    return matchRepository.registerResult(id, dto, {
      actorUserId: actor.userId,
      isCorrection,
    });
  },

  async remove(id: string) {
    const match = await getMatchById(id);
    if (match.resultLocked) {
      throw new ApiError(
        409,
        "MATCH_RESULT_LOCKED",
        "Este partido ya fue jugado y su resultado fue confirmado: ya no se puede eliminar"
      );
    }
    await matchRepository.delete(id);
  },
};
