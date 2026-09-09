import { z } from "zod";

export const updateSeasonSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(150).optional(),
});
export type UpdateSeasonDto = z.infer<typeof updateSeasonSchema>;
