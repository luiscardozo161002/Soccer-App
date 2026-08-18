import { z } from "zod";
import { pageSizeSchema } from "@/lib/validation/pagination";

const photoDataUrl = z
  .string()
  .startsWith("data:image/", "La foto debe ser una imagen codificada en base64");

const leagueCategoryValues = ["primera_division", "division_ascenso", "segunda_division"] as const;

export const createTeamSchema = z.object({
  name: z.string().trim().min(1).max(100),
  registeredAt: z.coerce.date().optional(),
  category: z.enum(leagueCategoryValues).optional(),
  photo: photoDataUrl.optional(),
});
export type CreateTeamDto = z.infer<typeof createTeamSchema>;

export const updateTeamSchema = createTeamSchema.partial();
export type UpdateTeamDto = z.infer<typeof updateTeamSchema>;

export const listTeamsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: pageSizeSchema,
  category: z.enum(leagueCategoryValues).optional(),
});
export type ListTeamsQuery = z.infer<typeof listTeamsQuerySchema>;
