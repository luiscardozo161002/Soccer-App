import { prisma } from "@/lib/prisma";
import { ApiError, notFoundError } from "@/lib/errors";
import { cupMatchRepository } from "@/lib/repositories/cup-match.repository";
import { cupEntryRepository } from "@/lib/repositories/cup-entry.repository";
import { teamRepository } from "@/lib/repositories/team.repository";
import { fieldRepository } from "@/lib/repositories/field.repository";
import type {
  CreateCupMatchDto,
  ListCupMatchesQuery,
  RegisterCupResultDto,
  UpdateCupMatchDto,
} from "@/lib/validation/cup-match.schema";

export const cupMatchService = {
  async list(query: ListCupMatchesQuery) {
    const [items, totalItems] = await Promise.all([
      cupMatchRepository.findMany(query),
      cupMatchRepository.count(query),
    ]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) };
  },

  async getById(id: string) {
    const match = await cupMatchRepository.findById(id);
    if (!match) {
      throw notFoundError("CUP_MATCH_NOT_FOUND", "el partido de copa", id);
    }
    return match;
  },

  async create(dto: CreateCupMatchDto) {
    const [homeTeam, awayTeam] = await Promise.all([
      teamRepository.findById(dto.homeTeamId),
      teamRepository.findById(dto.awayTeamId),
    ]);
    if (!homeTeam) throw notFoundError("TEAM_NOT_FOUND", "el equipo local", dto.homeTeamId);
    if (!awayTeam) throw notFoundError("TEAM_NOT_FOUND", "el equipo visitante", dto.awayTeamId);

    if (dto.fieldId) {
      const field = await fieldRepository.findById(dto.fieldId);
      if (!field) throw notFoundError("FIELD_NOT_FOUND", "la cancha", dto.fieldId);
      if (dto.time) {
        const conflict = await cupMatchRepository.findFieldConflict(dto.fieldId, dto.date, dto.time);
        if (conflict) {
          throw new ApiError(409, "FIELD_TIME_CONFLICT", "Ya hay otro partido de copa en esa cancha, fecha y hora");
        }
      }
    }

    return cupMatchRepository.create(dto);
  },

  async update(id: string, dto: UpdateCupMatchDto) {
    const match = await this.getById(id);
    if (match.resultLocked) {
      throw new ApiError(409, "CUP_MATCH_RESULT_LOCKED", "Este partido ya tiene un resultado registrado");
    }

    const fieldId = dto.fieldId ?? match.fieldId ?? undefined;
    const date = dto.date ?? match.date;
    const time = dto.time ?? match.time ?? undefined;
    const touchedScheduling = dto.fieldId !== undefined || dto.date !== undefined || dto.time !== undefined;
    if (fieldId && time && touchedScheduling) {
      const conflict = await cupMatchRepository.findFieldConflict(fieldId, date, time, id);
      if (conflict) {
        throw new ApiError(409, "FIELD_TIME_CONFLICT", "Ya hay otro partido de copa en esa cancha, fecha y hora");
      }
    }

    return cupMatchRepository.update(id, dto);
  },

  async registerResult(id: string, dto: RegisterCupResultDto) {
    const match = await this.getById(id);
    if (match.resultLocked) {
      throw new ApiError(409, "CUP_MATCH_RESULT_LOCKED", "Este partido ya tiene un resultado registrado");
    }

    const updated = await cupMatchRepository.registerResult(id, {
      homeGoals: dto.homeGoals,
      awayGoals: dto.awayGoals,
      forfeit: dto.forfeit ?? false,
      forfeitReason: dto.forfeit ? dto.forfeitReason || null : null,
    });

    // Eliminación directa: the loser is knocked out automatically. Skipped
    // on a tie (shouldn't happen outside a forfeit, but then we can't tell
    // who lost) so neither side gets wrongly eliminated.
    if (dto.homeGoals !== dto.awayGoals) {
      const loserTeamId = dto.homeGoals < dto.awayGoals ? match.homeTeamId : match.awayTeamId;
      const loserEntry = await cupEntryRepository.findByCupAndTeam(match.cupId, loserTeamId);
      if (loserEntry && loserEntry.status === "active") {
        await cupEntryRepository.eliminate(loserEntry.id, `Eliminado en ${match.round}`);
      }
    }

    return updated;
  },

  // Only allowed while nobody has been paired into a newer match yet —
  // reopening after the bracket has moved on would leave it inconsistent.
  async reopen(id: string) {
    const match = await this.getById(id);
    if (!match.resultLocked) {
      throw new ApiError(409, "CUP_MATCH_NOT_LOCKED", "Este partido no tiene un resultado que reabrir");
    }

    const laterMatch = await cupMatchRepository.findLaterMatchForTeams(
      match.cupId,
      [match.homeTeamId, match.awayTeamId],
      match.createdAt,
      match.id
    );
    if (laterMatch) {
      throw new ApiError(
        409,
        "CUP_MATCH_ALREADY_ADVANCED",
        "Ya se emparejó a alguno de estos equipos en otro partido; no se puede reabrir este resultado"
      );
    }

    return prisma.$transaction(async (tx) => {
      const reopened = await tx.cupMatch.update({
        where: { id },
        data: {
          homeGoals: null,
          awayGoals: null,
          forfeit: false,
          forfeitReason: null,
          status: "scheduled",
          resultLocked: false,
        },
      });
      await tx.cupEntry.updateMany({
        where: {
          cupId: match.cupId,
          teamId: { in: [match.homeTeamId, match.awayTeamId] },
          status: { not: "withdrawn" },
        },
        data: { status: "active", eliminatedReason: null, eliminatedAt: null },
      });
      return reopened;
    });
  },

  async remove(id: string) {
    const match = await this.getById(id);
    if (match.resultLocked) {
      throw new ApiError(409, "CUP_MATCH_RESULT_LOCKED", "Este partido ya tiene un resultado registrado");
    }
    return cupMatchRepository.delete(id);
  },
};
