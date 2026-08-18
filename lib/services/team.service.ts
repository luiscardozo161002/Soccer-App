import { ApiError, notFoundError } from "@/lib/errors";
import { optimizeImageFromDataUrl } from "@/lib/utils/images";
import { teamRepository } from "@/lib/repositories/team.repository";
import type { Prisma, LeagueCategory } from "@/app/generated/prisma/client";
import type { CreateTeamDto, UpdateTeamDto } from "@/lib/validation/team.schema";

async function toWriteData(dto: CreateTeamDto | UpdateTeamDto): Promise<Prisma.TeamUncheckedUpdateInput> {
  const data: Prisma.TeamUncheckedUpdateInput = {
    name: dto.name,
    registeredAt: dto.registeredAt,
    category: dto.category,
  };
  if (dto.photo) {
    const { buffer, type } = await optimizeImageFromDataUrl(dto.photo);
    data.photo = new Uint8Array(buffer);
    data.photoType = type;
    data.photoUpdatedAt = new Date();
  }
  return data;
}

export const teamService = {
  async list(page: number, pageSize: number, category?: LeagueCategory) {
    const [items, totalItems] = await Promise.all([
      teamRepository.findMany({ page, pageSize, category }),
      teamRepository.count(category),
    ]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / pageSize) };
  },

  async getById(id: string) {
    const team = await teamRepository.findById(id);
    if (!team) {
      throw notFoundError("TEAM_NOT_FOUND", "el equipo", id);
    }
    return team;
  },

  async create(dto: CreateTeamDto) {
    const existing = await teamRepository.findByName(dto.name);
    if (existing) {
      throw new ApiError(409, "TEAM_NAME_DUPLICATED", `A team named "${dto.name}" already exists`);
    }
    const data = await toWriteData(dto);
    return teamRepository.create({ ...data, name: dto.name } as Prisma.TeamUncheckedCreateInput);
  },

  async update(id: string, dto: UpdateTeamDto) {
    await this.getById(id);
    return teamRepository.update(id, await toWriteData(dto));
  },

  async remove(id: string) {
    await this.getById(id);
    await teamRepository.delete(id);
  },
};
