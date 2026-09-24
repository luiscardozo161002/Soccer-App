import { ApiError, notFoundError } from "@/lib/errors";
import type { LeagueCategoryValue } from "@/lib/constants/league-categories";
import { optimizeImageFromDataUrl } from "@/lib/utils/images";
import { teamRepository } from "@/modules/teams/server/team.repository";
import type { CreatePlayerDto, UpdatePlayerDto } from "../player.schema";
import { playerRepository, type PlayerWriteData } from "./player.repository";

async function toWriteData(dto: CreatePlayerDto | UpdatePlayerDto): Promise<PlayerWriteData> {
  const data: PlayerWriteData = {
    teamId: dto.teamId,
    name: dto.name,
    birthDate: dto.birthDate,
  };

  if (dto.photo) {
    const { buffer, type } = await optimizeImageFromDataUrl(dto.photo);
    data.photo = Uint8Array.from(buffer);
    data.photoType = type;
    data.photoUpdatedAt = new Date();
  } else if (dto.photo === null) {
    data.photo = null;
    data.photoType = null;
    data.photoUpdatedAt = new Date();
  }

  return data;
}

async function getPlayerById(id: string) {
  const player = await playerRepository.findById(id);
  if (!player) throw notFoundError("PLAYER_NOT_FOUND", "el jugador", id);
  return player;
}

function registrationNumber(prefix: string, number: string) {
  return `${prefix}-${number}`;
}

async function ensureAvailableFolio(folio: string, exceptPlayerId?: string) {
  const duplicated = await playerRepository.findByRegistrationNumber(folio);
  if (duplicated && duplicated.id !== exceptPlayerId) {
    throw new ApiError(409, "REGISTRATION_NUMBER_DUPLICATED", `El folio ${folio} ya está registrado`);
  }
}

async function ensureAvailableName(name: string, exceptPlayerId?: string) {
  const duplicated = await playerRepository.findByNameInsensitive(name);
  if (duplicated && duplicated.id !== exceptPlayerId) {
    throw new ApiError(409, "PLAYER_NAME_DUPLICATED", `Ya existe un jugador con el nombre "${name}"`);
  }
}

export const playerService = {
  async list(page: number, pageSize: number, teamId?: string, category?: LeagueCategoryValue) {
    const [items, totalItems] = await Promise.all([
      playerRepository.findMany({ page, pageSize, teamId, category }),
      playerRepository.count(teamId, category),
    ]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / pageSize) };
  },

  getById: getPlayerById,

  async create(dto: CreatePlayerDto) {
    await ensureAvailableName(dto.name);
    const team = await teamRepository.findById(dto.teamId);
    if (!team) throw notFoundError("TEAM_NOT_FOUND", "el equipo", dto.teamId);
    if (!team.folioPrefix) {
      throw new ApiError(
        409,
        "TEAM_MISSING_FOLIO_PREFIX",
        `El equipo "${team.name}" todavía no tiene un prefijo de folio asignado — configúralo antes de registrar jugadores`
      );
    }

    const folio = registrationNumber(team.folioPrefix, dto.folioNumber);
    await ensureAvailableFolio(folio);

    const data = await toWriteData(dto);
    return playerRepository.create({
      ...data,
      teamId: dto.teamId,
      name: dto.name,
      registrationNumber: folio,
      registeredAt: new Date(),
    });
  },

  async update(id: string, dto: UpdatePlayerDto) {
    const player = await getPlayerById(id);
    if (dto.name !== undefined) await ensureAvailableName(dto.name, id);

    const teamChanged = dto.teamId !== undefined && dto.teamId !== player.teamId;
    let folio: string | undefined;
    if (teamChanged || dto.folioNumber !== undefined) {
      const teamId = dto.teamId ?? player.teamId;
      const team = await teamRepository.findById(teamId);
      if (!team) throw notFoundError("TEAM_NOT_FOUND", "el equipo", teamId);
      if (!team.folioPrefix) {
        throw new ApiError(409, "TEAM_MISSING_FOLIO_PREFIX", `El equipo "${team.name}" no tiene prefijo de folio`);
      }
      const number = dto.folioNumber ?? player.registrationNumber.match(/^[A-Z0-9]{3}-(\d+)$/)?.[1];
      if (!number) {
        throw new ApiError(422, "INVALID_FOLIO_NUMBER", "Ingresa los dígitos del folio para cambiar de equipo");
      }
      folio = registrationNumber(team.folioPrefix, number);
      await ensureAvailableFolio(folio, id);
    }

    const data = await toWriteData(dto);
    if (folio) data.registrationNumber = folio;

    return playerRepository.update(id, data);
  },

  async remove(id: string) {
    await getPlayerById(id);
    await playerRepository.delete(id);
  },
};
