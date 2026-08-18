import { z } from "zod";

export const createCupEntriesSchema = z.object({
  cupId: z.string().uuid(),
  teamIds: z.array(z.string().uuid()).min(1, "Selecciona al menos un equipo"),
});
export type CreateCupEntriesDto = z.infer<typeof createCupEntriesSchema>;

export const withdrawCupEntrySchema = z.object({
  reason: z.string().trim().min(1, "Indica el motivo").max(300),
});
export type WithdrawCupEntryDto = z.infer<typeof withdrawCupEntrySchema>;

export const listCupEntriesQuerySchema = z.object({
  cupId: z.string().uuid(),
});
export type ListCupEntriesQuery = z.infer<typeof listCupEntriesQuerySchema>;
