import { prisma } from "@/lib/prisma";
import { ApiError, notFoundError } from "@/lib/errors";
import { matchRepository, includeCategory, mapMatch } from "@/lib/repositories/match.repository";
import { teamRepository } from "@/lib/repositories/team.repository";
import { fieldRepository } from "@/lib/repositories/field.repository";
import { seasonService } from "@/lib/services/season.service";
import type {
  CreateMatchDto,
  ListMatchesQuery,
  RegisterResultDto,
  UpdateMatchDto,
} from "@/lib/validation/match.schema";

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function todayIsoDay() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Date-only check: today is always allowed (all day), only calendar days
// strictly before today are rejected. Time is optional and, when present,
// isn't part of this check.
function assertDateNotBeforeToday(date: Date) {
  if (isoDay(date) < todayIsoDay()) {
    throw new ApiError(422, "MATCH_DATE_IN_PAST", "La fecha del partido no puede ser anterior a hoy");
  }
}

function toDateTime(date: Date, time: string) {
  return new Date(`${isoDay(date)}T${time}:00`);
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

  async getById(id: string) {
    const match = await matchRepository.findById(id);
    if (!match) {
      throw notFoundError("MATCH_NOT_FOUND", "el partido", id);
    }
    return match;
  },

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

    assertDateNotBeforeToday(dto.date);

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
    const match = await this.getById(id);

    if (match.resultLocked) {
      throw new ApiError(
        409,
        "MATCH_RESULT_LOCKED",
        "Este partido ya fue jugado y su resultado fue confirmado: ya no se puede editar"
      );
    }

    if (dto.fieldId) {
      const field = await fieldRepository.findById(dto.fieldId);
      if (!field) throw notFoundError("FIELD_NOT_FOUND", "la cancha", dto.fieldId);
    }

    const resultingStatus = dto.status ?? match.status;
    if (dto.date && resultingStatus === "scheduled") {
      assertDateNotBeforeToday(dto.date);
    }

    if (resultingStatus === "postponed" || resultingStatus === "cancelled") {
      const resultingReason = dto.statusReason ?? match.statusReason;
      if (!resultingReason || !resultingReason.trim()) {
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
    const match = await this.getById(id);
    // An already-locked result can only be corrected by an admin (e.g. the
    // referee made a mistake) — everyone else still hits the hard lock.
    const isCorrectingLockedResult = match.resultLocked;
    if (isCorrectingLockedResult && !actor.isAdmin) {
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
    if (match.status === "scheduled" && toDateTime(match.date, match.time) > new Date()) {
      throw new ApiError(
        409,
        "MATCH_NOT_STARTED",
        "No se puede registrar el resultado antes de la hora programada del partido"
      );
    }

    // Serializable: two matches of the same jornada landing on the same
    // suspension's range at once must not both miscount toward "fulfilled".
    return prisma.$transaction(
      async (tx) => {
        const updated = await tx.match.update({
          where: { id },
          data: {
            homeGoals: dto.homeGoals,
            awayGoals: dto.awayGoals,
            forfeit: dto.forfeit ?? false,
            forfeitReason: dto.forfeit ? dto.forfeitReason || null : null,
            status: "played",
            resultLocked: true,
            ...(isCorrectingLockedResult
              ? { resultEditedAt: new Date(), resultEditedById: actor.userId }
              : {}),
          },
          include: includeCategory,
        });

        // CANCELADO/APLAZADO never reach here — this only runs on the one
        // path that sets status "played", so a cancelled/postponed match
        // can never consume a suspension by construction.
        for (const teamId of [updated.homeTeamId, updated.awayTeamId]) {
          const sanctions = await tx.sanction.findMany({
            where: {
              fulfilled: false,
              matchdayStart: { lte: updated.matchday },
              matchdayEnd: { gte: updated.matchday },
              card: { player: { teamId } },
            },
          });

          for (const sanction of sanctions) {
            const already = await tx.sanctionMatch.findUnique({
              where: { sanctionId_matchId: { sanctionId: sanction.id, matchId: id } },
            });
            if (!already) {
              await tx.sanctionMatch.create({ data: { sanctionId: sanction.id, matchId: id } });
            }

            const appliedCount = await tx.sanctionMatch.count({ where: { sanctionId: sanction.id } });
            if (appliedCount >= sanction.matchesSuspended) {
              await tx.sanction.update({ where: { id: sanction.id }, data: { fulfilled: true } });
            }
          }
        }

        return mapMatch(updated);
      },
      { isolationLevel: "Serializable" }
    );
  },

  async remove(id: string) {
    const match = await this.getById(id);
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
