import { ApiError } from "@/lib/errors";
import { fieldRepository } from "@/lib/repositories/field.repository";
import type { CreateFieldDto, UpdateFieldDto } from "@/lib/validation/field.schema";

export const fieldService = {
  async list(page: number, pageSize: number) {
    const [items, totalItems] = await Promise.all([
      fieldRepository.findMany({ page, pageSize }),
      fieldRepository.count(),
    ]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / pageSize) };
  },

  async getById(id: string) {
    const field = await fieldRepository.findById(id);
    if (!field) {
      throw new ApiError(404, "FIELD_NOT_FOUND", `No field exists with id ${id}`);
    }
    return field;
  },

  async create(dto: CreateFieldDto) {
    return fieldRepository.create(dto);
  },

  async update(id: string, dto: UpdateFieldDto) {
    await this.getById(id);
    return fieldRepository.update(id, dto);
  },

  async remove(id: string) {
    await this.getById(id);
    await fieldRepository.delete(id);
  },
};
