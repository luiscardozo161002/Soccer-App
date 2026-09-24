import { z } from "zod";
import { pageSizeSchema } from "@/lib/validation/pagination";

export const cardTypeValues = ["yellow", "red"] as const;

export const createCardSchema = z.object({
  playerId: z.string().uuid(),
  matchId: z.string().uuid(),
  type: z.enum(cardTypeValues),
  detail: z.string().trim().min(1).max(255),
  matchesSuspended: z.number().int().min(1).max(99).optional(),
}).refine((data) => data.type !== "red" || data.matchesSuspended !== undefined, {
  message: "Indica los partidos de suspensión para la tarjeta roja",
  path: ["matchesSuspended"],
}).refine((data) => data.type === "red" || data.matchesSuspended === undefined, {
  message: "Solo una tarjeta roja puede generar suspensión",
  path: ["matchesSuspended"],
});
export type CreateCardDto = z.infer<typeof createCardSchema>;

export const updateCardSchema = z.object({ paid: z.boolean().optional() });
export type UpdateCardDto = z.infer<typeof updateCardSchema>;

export const listCardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: pageSizeSchema,
  playerId: z.string().uuid().optional(),
  matchId: z.string().uuid().optional(),
  type: z.enum(cardTypeValues).optional(),
  paid: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  category: z.enum(["primera_division", "division_ascenso", "segunda_division"]).optional(),
  search: z.string().trim().max(100).optional(),
});
export type ListCardsQuery = z.infer<typeof listCardsQuerySchema>;
