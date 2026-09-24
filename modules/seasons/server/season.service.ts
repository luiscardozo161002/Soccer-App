import { ApiError, notFoundError } from "@/lib/errors";
import type { UpdateSeasonDto } from "../season.schema";
import { seasonRepository } from "./season.repository";

async function getSeasonById(id: string) {
  const season = await seasonRepository.findById(id);
  if (!season) throw notFoundError("SEASON_NOT_FOUND", "la temporada", id);
  return season;
}

async function getActiveSeason() {
  const season = await seasonRepository.findActive();
  if (!season) throw new ApiError(500, "NO_ACTIVE_SEASON", "No hay una temporada activa");
  return season;
}

export const seasonService = {
  list: seasonRepository.findAll,
  getById: getSeasonById,
  getActive: getActiveSeason,
  async update(id: string, dto: UpdateSeasonDto) {
    await getSeasonById(id);
    return seasonRepository.update(id, dto);
  },
};
