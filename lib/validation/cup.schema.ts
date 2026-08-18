import { z } from "zod";

export const createCupSchema = z.object({
  name: z.string().trim().min(1).max(100),
});
export type CreateCupDto = z.infer<typeof createCupSchema>;
