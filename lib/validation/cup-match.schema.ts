import { z } from "zod";

const cupTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato HH:mm");

export const createCupMatchSchema = z
  .object({
    cupId: z.string().uuid(),
    round: z.string().trim().min(1, "La ronda es obligatoria").max(80),
    homeTeamId: z.string().uuid("Selecciona el equipo local"),
    awayTeamId: z.string().uuid("Selecciona el equipo visitante"),
    fieldId: z.string().uuid().optional(),
    date: z.coerce.date(),
    time: cupTimeSchema.optional(),
  })
  .refine((data) => data.homeTeamId !== data.awayTeamId, {
    message: "El local y el visitante deben ser distintos",
    path: ["awayTeamId"],
  });
export type CreateCupMatchDto = z.infer<typeof createCupMatchSchema>;

export const updateCupMatchSchema = z.object({
  round: z.string().trim().min(1).max(80).optional(),
  fieldId: z.string().uuid().optional(),
  date: z.coerce.date().optional(),
  time: cupTimeSchema.optional(),
  status: z.enum(["scheduled", "postponed", "cancelled"]).optional(),
});
export type UpdateCupMatchDto = z.infer<typeof updateCupMatchSchema>;

// A knockout round always needs a winner: a tied score is only accepted
// when it's actually a forfeit (whose score is fixed 3-0 anyway), never as
// a genuine drawn result — otherwise the bracket would have an ambiguous
// dangling match with nobody advancing.
export const registerCupResultSchema = z
  .object({
    homeGoals: z.number().int().min(0),
    awayGoals: z.number().int().min(0),
    forfeit: z.boolean().optional(),
    forfeitReason: z.string().trim().max(300).optional(),
  })
  .refine((data) => data.forfeit || data.homeGoals !== data.awayGoals, {
    message: "Un partido de copa no puede quedar empatado; usa \"ganado por default\" si no se jugó",
    path: ["awayGoals"],
  });
export type RegisterCupResultDto = z.infer<typeof registerCupResultSchema>;

export const listCupMatchesQuerySchema = z.object({
  cupId: z.string().uuid(),
  round: z.string().optional(),
});
export type ListCupMatchesQuery = z.infer<typeof listCupMatchesQuerySchema>;
