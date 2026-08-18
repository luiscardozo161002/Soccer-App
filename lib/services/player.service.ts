import { ApiError } from "@/lib/errors";
import { optimizeImageFromDataUrl } from "@/lib/utils/images";
import { playerRepository } from "@/lib/repositories/player.repository";
import { teamRepository } from "@/lib/repositories/team.repository";
import type { Prisma } from "@/app/generated/prisma/client";
import type { CreatePlayerDto, UpdatePlayerDto } from "@/lib/validation/player.schema";

async function toWriteData(
  dto: CreatePlayerDto | UpdatePlayerDto
): Promise<Prisma.PlayerUncheckedUpdateInput> {
  const data: Prisma.PlayerUncheckedUpdateInput = {
    teamId: dto.teamId,
    name: dto.name,
    birthDate: dto.birthDate,
    registrationNumber: dto.registrationNumber,
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
  async list(page: number, pageSize: number, teamId?: string) {
    const [items, totalItems] = await Promise.all([
      playerRepository.findMany({ page, pageSize, teamId }),
      playerRepository.count(teamId),
    ]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / pageSize) };
  },

  async getById(id: string) {
    const player = await playerRepository.findById(id);
    if (!player) {
      throw new ApiError(404, "PLAYER_NOT_FOUND", `No player exists with id ${id}`);
    }
    return player;
  },

  async create(dto: CreatePlayerDto) {
    const team = await teamRepository.findById(dto.teamId);
    if (!team) {
      throw new ApiError(404, "TEAM_NOT_FOUND", `No team exists with id ${dto.teamId}`);
    }

    const duplicated = await playerRepository.findByRegistrationNumber(dto.registrationNumber);
    if (duplicated) {
      throw new ApiError(
        409,
        "REGISTRATION_NUMBER_DUPLICATED",
        `A player with registration number "${dto.registrationNumber}" already exists`
      );
    }

    const data = await toWriteData(dto);
    return playerRepository.create({
      ...data,
      teamId: dto.teamId,
      name: dto.name,
      registrationNumber: dto.registrationNumber,
    } as Prisma.PlayerUncheckedCreateInput);
  },

  async update(id: string, dto: UpdatePlayerDto) {
    await this.getById(id);

    if (dto.teamId) {
      const team = await teamRepository.findById(dto.teamId);
      if (!team) {
        throw new ApiError(404, "TEAM_NOT_FOUND", `No team exists with id ${dto.teamId}`);
      }
    }

    if (dto.registrationNumber) {
      const duplicated = await playerRepository.findByRegistrationNumber(dto.registrationNumber);
      if (duplicated && duplicated.id !== id) {
        throw new ApiError(
          409,
          "REGISTRATION_NUMBER_DUPLICATED",
          `A player with registration number "${dto.registrationNumber}" already exists`
        );
      }
    }

    return playerRepository.update(id, await toWriteData(dto));
  },

  async remove(id: string) {
    await this.getById(id);
    await playerRepository.delete(id);
  },
};
