import { ApiError, notFoundError } from "@/lib/errors";
import { matchRepository } from "@/modules/matches/server/match.repository";
import type { CreateFieldDto, UpdateFieldDto } from "../field.schema";
import { fieldRepository } from "./field.repository";

async function getFieldById(id: string) {
  const field = await fieldRepository.findById(id);
  if (!field) throw notFoundError("FIELD_NOT_FOUND", "la cancha", id);
  return field;
}

export const fieldService = {
  async list(page: number, pageSize: number) {
    const [items, totalItems] = await Promise.all([
      fieldRepository.findMany({ page, pageSize }),
      fieldRepository.count(),
    ]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / pageSize) };
  },
  getById: getFieldById,
  create(dto: CreateFieldDto) {
    return fieldRepository.create(dto);
  },
  async update(id: string, dto: UpdateFieldDto) {
    await getFieldById(id);
    return fieldRepository.update(id, dto);
  },
  async remove(id: string) {
    await getFieldById(id);
    if ((await matchRepository.countByField(id)) > 0) {
      throw new ApiError(
        409,
        "FIELD_HAS_MATCHES",
        "No se puede eliminar una cancha con partidos pendientes o jugados asociados"
      );
    }
    await fieldRepository.delete(id);
  },
};
