import { z } from "zod";

export const createFieldSchema = z.object({
  name: z.string().trim().min(1).max(100),
  location: z.string().trim().max(200).optional(),
});
export type CreateFieldDto = z.infer<typeof createFieldSchema>;

export const updateFieldSchema = createFieldSchema.partial();
export type UpdateFieldDto = z.infer<typeof updateFieldSchema>;

export const listFieldsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListFieldsQuery = z.infer<typeof listFieldsQuerySchema>;
