import { z } from "zod";

export const createEquipoSchema = z.object({
  nombre: z.string().trim().min(1).max(100),
  fechaIngreso: z.coerce.date().optional(),
  foto: z.string().url().optional().nullable(),
});
export type CreateEquipoDto = z.infer<typeof createEquipoSchema>;

export const updateEquipoSchema = createEquipoSchema.partial();
export type UpdateEquipoDto = z.infer<typeof updateEquipoSchema>;

export const listEquiposQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListEquiposQuery = z.infer<typeof listEquiposQuerySchema>;
