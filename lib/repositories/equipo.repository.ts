import { prisma } from "@/lib/prisma";
import type { CreateEquipoDto, UpdateEquipoDto } from "@/lib/validation/equipo.schema";

export const equipoRepository = {
  findMany({ page, pageSize }: { page: number; pageSize: number }) {
    return prisma.equipo.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { nombre: "asc" },
    });
  },

  count() {
    return prisma.equipo.count();
  },

  findById(id: string) {
    return prisma.equipo.findUnique({ where: { id } });
  },

  findByNombre(nombre: string) {
    return prisma.equipo.findFirst({
      where: { nombre: { equals: nombre, mode: "insensitive" } },
    });
  },

  create(data: CreateEquipoDto) {
    return prisma.equipo.create({ data });
  },

  update(id: string, data: UpdateEquipoDto) {
    return prisma.equipo.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.equipo.delete({ where: { id } });
  },
};
