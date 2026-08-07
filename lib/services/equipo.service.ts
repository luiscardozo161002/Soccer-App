import { ApiError } from "@/lib/errors";
import { equipoRepository } from "@/lib/repositories/equipo.repository";
import type { CreateEquipoDto, UpdateEquipoDto } from "@/lib/validation/equipo.schema";

export const equipoService = {
  async list(page: number, pageSize: number) {
    const [items, totalItems] = await Promise.all([
      equipoRepository.findMany({ page, pageSize }),
      equipoRepository.count(),
    ]);
    return { items, totalItems, totalPages: Math.ceil(totalItems / pageSize) };
  },

  async getById(id: string) {
    const equipo = await equipoRepository.findById(id);
    if (!equipo) {
      throw new ApiError(404, "EQUIPO_NOT_FOUND", `No existe un equipo con id ${id}`);
    }
    return equipo;
  },

  async create(dto: CreateEquipoDto) {
    const existente = await equipoRepository.findByNombre(dto.nombre);
    if (existente) {
      throw new ApiError(409, "EQUIPO_NOMBRE_DUPLICADO", `Ya existe un equipo llamado "${dto.nombre}"`);
    }
    return equipoRepository.create(dto);
  },

  async update(id: string, dto: UpdateEquipoDto) {
    await this.getById(id);
    return equipoRepository.update(id, dto);
  },

  async remove(id: string) {
    await this.getById(id);
    await equipoRepository.delete(id);
  },
};
