import { standingsRepository } from "@/lib/repositories/standings.repository";
import { seasonService } from "@/lib/services/season.service";

export const standingsService = {
  async list(seasonId?: string) {
    if (seasonId) {
      await seasonService.getById(seasonId);
      return standingsRepository.findBySeason(seasonId);
    }
    const active = await seasonService.getActive();
    return standingsRepository.findBySeason(active.id);
  },
};
