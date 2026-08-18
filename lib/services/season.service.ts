import { ApiError, notFoundError } from "@/lib/errors";
import { seasonRepository } from "@/lib/repositories/season.repository";

export const seasonService = {
  list() {
    return seasonRepository.findAll();
  },

  async getById(id: string) {
    const season = await seasonRepository.findById(id);
    if (!season) {
      throw notFoundError("SEASON_NOT_FOUND", "la temporada", id);
    }
    return season;
  },

  async getActive() {
    const season = await seasonRepository.findActive();
    if (!season) {
      throw new ApiError(500, "NO_ACTIVE_SEASON", "No hay una temporada activa");
    }
    return season;
  },
};
