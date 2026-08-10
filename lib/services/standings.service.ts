import { standingsRepository } from "@/lib/repositories/standings.repository";

export const standingsService = {
  list() {
    return standingsRepository.findAll();
  },
};
