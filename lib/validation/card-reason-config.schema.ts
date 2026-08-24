import { z } from "zod";
import { pageSizeSchema } from "@/lib/validation/pagination";

const cardTypeValues = ["yellow", "red"] as const;

export const createCardReasonConfigSchema = z.object({
  cardType: z.enum(cardTypeValues),
  reason: z.string().trim().min(1).max(255),
  amount: z.number().min(0),
  active: z.boolean().default(true),
});
export type CreateCardReasonConfigDto = z.infer<typeof createCardReasonConfigSchema>;

export const updateCardReasonConfigSchema = z.object({
  amount: z.number().min(0).optional(),
  active: z.boolean().optional(),
});
export type UpdateCardReasonConfigDto = z.infer<typeof updateCardReasonConfigSchema>;

export const listCardReasonConfigsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: pageSizeSchema,
  cardType: z.enum(cardTypeValues).optional(),
  active: z.coerce.boolean().optional(),
});
export type ListCardReasonConfigsQuery = z.infer<typeof listCardReasonConfigsQuerySchema>;
