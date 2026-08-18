import { z } from "zod";
import { pageSizeSchema } from "@/lib/validation/pagination";

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
  waivedByPayment: z.boolean().optional(),
});
export type UpdateSanctionDto = z.infer<typeof updateSanctionSchema>;

export const listSanctionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: pageSizeSchema,
  cardId: z.string().uuid().optional(),
  // z.coerce.boolean() would turn "false" into true (any non-empty string
  // is truthy), so the raw string is compared explicitly instead.
  fulfilled: z
    .preprocess((v) => (typeof v === "string" ? v === "true" : v), z.boolean())
    .optional(),
});
export type ListSanctionsQuery = z.infer<typeof listSanctionsQuerySchema>;
