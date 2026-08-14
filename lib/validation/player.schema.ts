import { z } from "zod";

const photoDataUrl = z
  .string()
  .startsWith("data:image/", "La foto debe ser una imagen codificada en base64");

export const createPlayerSchema = z.object({
  teamId: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  photo: photoDataUrl.optional(),
  birthDate: z.coerce.date().optional(),
  registrationNumber: z.string().trim().min(1).max(30),
});
export type CreatePlayerDto = z.infer<typeof createPlayerSchema>;

export const updatePlayerSchema = createPlayerSchema.partial().extend({
  photo: photoDataUrl.nullable().optional(),
});
export type UpdatePlayerDto = z.infer<typeof updatePlayerSchema>;

export const listPlayersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  teamId: z.string().uuid().optional(),
});
export type ListPlayersQuery = z.infer<typeof listPlayersQuerySchema>;
