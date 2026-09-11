import { ApiError, notFoundError } from "@/lib/errors";
import { optimizeImageFromDataUrl } from "@/lib/utils/images";
import { nextPlayerFolio } from "@/lib/utils/folio";
import { playerRepository } from "@/lib/repositories/player.repository";
import { teamRepository } from "@/lib/repositories/team.repository";
import type { Prisma, LeagueCategory } from "@/app/generated/prisma/client";
import type { CreatePlayerDto, UpdatePlayerDto } from "@/lib/validation/player.schema";

async function toWriteData(
  dto: CreatePlayerDto | UpdatePlayerDto
): Promise<Prisma.PlayerUncheckedUpdateInput> {
  const data: Prisma.PlayerUncheckedUpdateInput = {
    teamId: dto.teamId,
    name: dto.name,
    birthDate: dto.birthDate,
  };
  if (dto.photo) {
    const { buffer, type } = await optimizeImageFromDataUrl(dto.photo);
    data.photo = new Uint8Array(buffer);
    data.photoType = type;
    data.photoUpdatedAt = new Date();
  } else if (dto.photo === null) {
    data.photo = null;
    data.photoType = null;
    data.photoUpdatedAt = new Date();
  }
  return data;
}

export const playerService = {
  async list(page: number, pageSize: number, teamId?: string, category?: LeagueCategory) {
    const [items, totalItems] = await Promise.all([
      playerRepository.findMany({ page, pageSize, teamId, category }),
      playerRepository.count(teamId, category),
    ]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / pageSize) };
  },

  async getById(id: string) {
    const player = await playerRepository.findById(id);
    if (!player) {
      throw notFoundError("PLAYER_NOT_FOUND", "el jugador", id);
    }
    return player;
  },

  async create(dto: CreatePlayerDto) {
    const team = await teamRepository.findById(dto.teamId);
    if (!team) {
      throw notFoundError("TEAM_NOT_FOUND", "el equipo", dto.teamId);
    }
    if (!team.folioPrefix) {
      throw new ApiError(
        409,
        "TEAM_MISSING_FOLIO_PREFIX",
        `El equipo "${team.name}" todavía no tiene un prefijo de folio asignado — configúralo antes de registrar jugadores`
      );
    }

    const issued = await playerRepository.findRegistrationNumbersByPrefix(team.folioPrefix);
    const registrationNumber = nextPlayerFolio(
      team.folioPrefix,
      issued.map((p) => p.registrationNumber)
    );

    const data = await toWriteData(dto);
    return playerRepository.create({
      ...data,
      teamId: dto.teamId,
      name: dto.name,
      registrationNumber,
      // Explicit even though Prisma's @default(now()) already covers it —
      // makes clear this is server-authoritative, never client-suppliable.
      registeredAt: new Date(),
    } as Prisma.PlayerUncheckedCreateInput);
  },

  async update(id: string, dto: UpdatePlayerDto) {
    await this.getById(id);

    if (dto.teamId) {
      const team = await teamRepository.findById(dto.teamId);
      if (!team) {
        throw notFoundError("TEAM_NOT_FOUND", "el equipo", dto.teamId);
      }
    }

    const data = await toWriteData(dto);
    if (dto.registrationNumber) {
      const duplicated = await playerRepository.findByRegistrationNumber(dto.registrationNumber);
      if (duplicated && duplicated.id !== id) {
        throw new ApiError(
          409,
          "REGISTRATION_NUMBER_DUPLICATED",
          `A player with registration number "${dto.registrationNumber}" already exists`
        );
      }
      data.registrationNumber = dto.registrationNumber;
    }

    return playerRepository.update(id, data);
  },

  async remove(id: string) {
    await this.getById(id);
    await playerRepository.delete(id);
  },
};
