import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
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
      throw new ApiError(404, "CUP_MATCH_NOT_FOUND", `No cup match exists with id ${id}`);
    }
    return match;
  },

  async create(dto: CreateCupMatchDto) {
    const [homeTeam, awayTeam] = await Promise.all([
      teamRepository.findById(dto.homeTeamId),
      teamRepository.findById(dto.awayTeamId),
    ]);
    if (!homeTeam) throw new ApiError(404, "TEAM_NOT_FOUND", "Equipo local no encontrado");
    if (!awayTeam) throw new ApiError(404, "TEAM_NOT_FOUND", "Equipo visitante no encontrado");

    if (dto.fieldId) {
      const field = await fieldRepository.findById(dto.fieldId);
      if (!field) throw new ApiError(404, "FIELD_NOT_FOUND", "Cancha no encontrada");
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

    // Core to "eliminación directa": the loser is automatically knocked out
    // of the cup, the same way the withdrawal flow auto-forfeits. Skipped
    // only if goals ended up tied (shouldn't happen — the schema rejects a
    // non-forfeit tie — but a forfeit sent with equal goals is defensively
    // treated as "can't tell who lost" rather than eliminating either side).
    if (dto.homeGoals !== dto.awayGoals) {
      const loserTeamId = dto.homeGoals < dto.awayGoals ? match.homeTeamId : match.awayTeamId;
      const loserEntry = await cupEntryRepository.findByCupAndTeam(match.cupId, loserTeamId);
      if (loserEntry && loserEntry.status === "active") {
        await cupEntryRepository.eliminate(loserEntry.id, `Eliminado en ${match.round}`);
      }
    }

    return updated;
  },

  // Bounded escape hatch for the one irreversible-by-design part of Liga
  // (resultLocked) that's much riskier in a bracket: a mis-typed score
  // there just leaves a wrong standings row, but here it permanently
  // ejects a team. Only allowed while nobody has been paired into a newer
  // match yet — i.e. the bracket hasn't already moved on from this result.
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
