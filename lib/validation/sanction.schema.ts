import { z } from "zod";

export const createSanctionSchema = z
  .object({
    matchdayStart: z.number().int().min(1),
    matchdayEnd: z.number().int().min(1),
    matchesSuspended: z.number().int().min(1),
  })
  .refine((data) => data.matchdayEnd >= data.matchdayStart, {
    message: "matchdayEnd must be greater than or equal to matchdayStart",
    path: ["matchdayEnd"],
  });
export type CreateSanctionDto = z.infer<typeof createSanctionSchema>;

export const updateSanctionSchema = z.object({
  matchdayStart: z.number().int().min(1).optional(),
  matchdayEnd: z.number().int().min(1).optional(),
  matchesSuspended: z.number().int().min(1).optional(),
  fulfilled: z.boolean().optional(),
});
export type UpdateSanctionDto = z.infer<typeof updateSanctionSchema>;

export const listSanctionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  cardId: z.string().uuid().optional(),
  fulfilled: z.coerce.boolean().optional(),
});
export type ListSanctionsQuery = z.infer<typeof listSanctionsQuerySchema>;
