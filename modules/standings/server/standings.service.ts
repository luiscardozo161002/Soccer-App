import { seasonService } from "@/modules/seasons/server/season.service";
import { standingsRepository } from "./standings.repository";

export const standingsService = {
  async list(seasonId?: string) {
    if (seasonId) {
      await seasonService.getById(seasonId);
      return standingsRepository.findBySeason(seasonId);
    }
    const activeSeason = await seasonService.getActive();
    return standingsRepository.findBySeason(activeSeason.id);
  },
};
