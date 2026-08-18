import { ApiError } from "@/lib/errors";
import { cupRepository } from "@/lib/repositories/cup.repository";
import type { CreateCupDto } from "@/lib/validation/cup.schema";

export const cupService = {
  list() {
    return cupRepository.findAll();
  },

  async getById(id: string) {
    const cup = await cupRepository.findById(id);
    if (!cup) {
      throw new ApiError(404, "CUP_NOT_FOUND", `No cup exists with id ${id}`);
    }
    return cup;
  },

  create(dto: CreateCupDto) {
    return cupRepository.create(dto);
  },
};
