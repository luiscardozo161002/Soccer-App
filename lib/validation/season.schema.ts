import { z } from "zod";

export const updateSeasonSchema = z.object({
  minMatchesPlayoffs: z.number().int().min(1).nullable().optional(),
});
export type UpdateSeasonDto = z.infer<typeof updateSeasonSchema>;
