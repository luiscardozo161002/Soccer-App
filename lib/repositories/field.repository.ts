import { prisma } from "@/lib/prisma";
import type { CreateFieldDto, UpdateFieldDto } from "@/lib/validation/field.schema";

export const fieldRepository = {
  findMany({ page, pageSize }: { page: number; pageSize: number }) {
    return prisma.field.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
    });
  },

  count() {
    return prisma.field.count();
  },

  findById(id: string) {
    return prisma.field.findUnique({ where: { id } });
  },

  create(data: CreateFieldDto) {
    return prisma.field.create({ data });
  },

  update(id: string, data: UpdateFieldDto) {
    return prisma.field.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.field.delete({ where: { id } });
  },
};
