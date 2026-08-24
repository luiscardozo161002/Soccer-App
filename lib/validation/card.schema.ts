import { z } from "zod";
import { pageSizeSchema } from "@/lib/validation/pagination";

const cardTypeValues = ["yellow", "red"] as const;

export const createCardSchema = z.object({
  playerId: z.string().uuid(),
  matchId: z.string().uuid(),
  type: z.enum(cardTypeValues),
  // detail must name an active CardReasonConfig reason for this type — the
  // amount is looked up server-side from there, never accepted from the
  // client (see cardService.create). No free-text "Otro" anymore.
  detail: z.string().trim().min(1).max(255),
});
export type CreateCardDto = z.infer<typeof createCardSchema>;

export const updateCardSchema = z.object({
  paid: z.boolean().optional(),
});
export type UpdateCardDto = z.infer<typeof updateCardSchema>;

export const listCardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: pageSizeSchema,
  playerId: z.string().uuid().optional(),
  matchId: z.string().uuid().optional(),
});
export type ListCardsQuery = z.infer<typeof listCardsQuerySchema>;
