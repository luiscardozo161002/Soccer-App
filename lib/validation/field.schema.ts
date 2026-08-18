import { z } from "zod";
import { pageSizeSchema } from "@/lib/validation/pagination";

export const createFieldSchema = z.object({
  name: z.string().trim().min(1).max(100),
  location: z.string().trim().max(200).optional(),
});
export type CreateFieldDto = z.infer<typeof createFieldSchema>;

export const updateFieldSchema = createFieldSchema.partial();
export type UpdateFieldDto = z.infer<typeof updateFieldSchema>;

export const listFieldsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: pageSizeSchema,
});
export type ListFieldsQuery = z.infer<typeof listFieldsQuerySchema>;
