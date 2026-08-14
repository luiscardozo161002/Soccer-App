import { z } from "zod";

const cardTypeValues = ["yellow", "red"] as const;

export const createCardSchema = z.object({
  playerId: z.string().uuid(),
  matchId: z.string().uuid(),
  type: z.enum(cardTypeValues),
  amount: z.number().min(0).optional(),
  detail: z.string().trim().max(255).optional(),
});
export type CreateCardDto = z.infer<typeof createCardSchema>;

export const updateCardSchema = z.object({
  amount: z.number().min(0).optional(),
  detail: z.string().trim().max(255).optional(),
  paid: z.boolean().optional(),
});
export type UpdateCardDto = z.infer<typeof updateCardSchema>;

export const listCardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  playerId: z.string().uuid().optional(),
  matchId: z.string().uuid().optional(),
});
export type ListCardsQuery = z.infer<typeof listCardsQuerySchema>;
