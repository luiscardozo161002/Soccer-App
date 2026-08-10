import { ApiError } from "@/lib/errors";
import { matchRepository } from "@/lib/repositories/match.repository";
import { teamRepository } from "@/lib/repositories/team.repository";
import { fieldRepository } from "@/lib/repositories/field.repository";
import type {
  CreateMatchDto,
  ListMatchesQuery,
  RegisterResultDto,
  UpdateMatchDto,
} from "@/lib/validation/match.schema";

export const matchService = {
  async list(query: ListMatchesQuery) {
    const [items, totalItems] = await Promise.all([
      matchRepository.findMany(query),
      matchRepository.count(query),
    ]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) };
  },

  async getById(id: string) {
    const match = await matchRepository.findById(id);
    if (!match) {
      throw new ApiError(404, "MATCH_NOT_FOUND", `No match exists with id ${id}`);
    }
    return match;
  },

  async create(dto: CreateMatchDto) {
    const [homeTeam, awayTeam, field] = await Promise.all([
      teamRepository.findById(dto.homeTeamId),
      teamRepository.findById(dto.awayTeamId),
      fieldRepository.findById(dto.fieldId),
    ]);
    if (!homeTeam) throw new ApiError(404, "TEAM_NOT_FOUND", `No team exists with id ${dto.homeTeamId}`);
    if (!awayTeam) throw new ApiError(404, "TEAM_NOT_FOUND", `No team exists with id ${dto.awayTeamId}`);
    if (!field) throw new ApiError(404, "FIELD_NOT_FOUND", `No field exists with id ${dto.fieldId}`);

    const conflict = await matchRepository.findFieldConflict(dto.fieldId, dto.date, dto.time);
    if (conflict) {
      throw new ApiError(409, "FIELD_ALREADY_BOOKED", "The field is already booked for that date and time");
    }

    return matchRepository.create(dto);
  },

  async update(id: string, dto: UpdateMatchDto) {
    const match = await this.getById(id);

    if (dto.fieldId) {
      const field = await fieldRepository.findById(dto.fieldId);
      if (!field) throw new ApiError(404, "FIELD_NOT_FOUND", `No field exists with id ${dto.fieldId}`);
    }

    if (dto.fieldId || dto.date || dto.time) {
      const conflict = await matchRepository.findFieldConflict(
        dto.fieldId ?? match.fieldId,
        dto.date ?? match.date,
        dto.time ?? match.time,
        id
      );
      if (conflict) {
        throw new ApiError(409, "FIELD_ALREADY_BOOKED", "The field is already booked for that date and time");
      }
    }

    return matchRepository.update(id, dto);
  },

  async registerResult(id: string, dto: RegisterResultDto) {
    const match = await this.getById(id);
    if (match.status === "played") {
      throw new ApiError(409, "MATCH_ALREADY_PLAYED", "This match's result was already recorded");
    }
    return matchRepository.registerResult(id, dto);
  },

  async remove(id: string) {
    await this.getById(id);
    await matchRepository.delete(id);
  },
};
