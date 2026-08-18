import { notFoundError } from "@/lib/errors";
import { cupRepository } from "@/lib/repositories/cup.repository";
import type { CreateCupDto } from "@/lib/validation/cup.schema";

export const cupService = {
  list() {
    return cupRepository.findAll();
  },

  async getById(id: string) {
    const cup = await cupRepository.findById(id);
    if (!cup) {
      throw notFoundError("CUP_NOT_FOUND", "la copa", id);
    }
    return cup;
  },

  create(dto: CreateCupDto) {
    return cupRepository.create(dto);
  },
};
