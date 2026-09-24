import { ApiError, notFoundError } from "@/lib/errors";
import type { LeagueCategoryValue } from "@/lib/constants/league-categories";
import { optimizeImageFromDataUrl } from "@/lib/utils/images";
import type { CreateTeamDto, UpdateTeamDto } from "../team.schema";
import { teamRepository, type TeamWriteData } from "./team.repository";

async function toWriteData(dto: CreateTeamDto | UpdateTeamDto): Promise<TeamWriteData> {
  const data: TeamWriteData = {
    name: dto.name,
    registeredAt: dto.registeredAt,
    category: dto.category,
    folioPrefix: dto.folioPrefix,
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

async function getTeamById(id: string) {
  const team = await teamRepository.findById(id);
  if (!team) throw notFoundError("TEAM_NOT_FOUND", "el equipo", id);
  return team;
}

export const teamService = {
  async list(page: number, pageSize: number, category?: LeagueCategoryValue) {
    const [items, totalItems] = await Promise.all([
      teamRepository.findMany({ page, pageSize, category }),
      teamRepository.count(category),
    ]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / pageSize) };
  },

  getById: getTeamById,

  async create(dto: CreateTeamDto) {
    const existing = await teamRepository.findByName(dto.name);
    if (existing) {
      throw new ApiError(409, "TEAM_NAME_DUPLICATED", `A team named "${dto.name}" already exists`);
    }

    const prefixTaken = await teamRepository.findByFolioPrefix(dto.folioPrefix);
    if (prefixTaken) {
      throw new ApiError(
        409,
        "FOLIO_PREFIX_DUPLICATED",
        `Another team ("${prefixTaken.name}") already uses the folio prefix "${dto.folioPrefix}"`
      );
    }

    const data = await toWriteData(dto);
    return teamRepository.create({ ...data, name: dto.name, folioPrefix: dto.folioPrefix });
  },

  async update(id: string, dto: UpdateTeamDto) {
    await getTeamById(id);
    if (dto.folioPrefix) {
      const prefixTaken = await teamRepository.findByFolioPrefix(dto.folioPrefix);
      if (prefixTaken && prefixTaken.id !== id) {
        throw new ApiError(
          409,
          "FOLIO_PREFIX_DUPLICATED",
          `Another team ("${prefixTaken.name}") already uses the folio prefix "${dto.folioPrefix}"`
        );
      }
    }
    return teamRepository.update(id, await toWriteData(dto));
  },

  async remove(id: string) {
    await getTeamById(id);
    await teamRepository.delete(id);
  },
};
