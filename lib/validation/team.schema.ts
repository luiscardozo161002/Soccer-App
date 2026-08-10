import { z } from "zod";

const photoDataUrl = z
  .string()
  .startsWith("data:image/", "La foto debe ser una imagen codificada en base64");

export const createTeamSchema = z.object({
  name: z.string().trim().min(1).max(100),
  registeredAt: z.coerce.date().optional(),
  photo: photoDataUrl.optional(),
});
export type CreateTeamDto = z.infer<typeof createTeamSchema>;

export const updateTeamSchema = createTeamSchema.partial();
export type UpdateTeamDto = z.infer<typeof updateTeamSchema>;

export const listTeamsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListTeamsQuery = z.infer<typeof listTeamsQuerySchema>;
