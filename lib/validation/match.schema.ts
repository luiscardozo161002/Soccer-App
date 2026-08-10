import { z } from "zod";

const timeFormat = /^([01]\d|2[0-3]):[0-5]\d$/;
const matchStatusValues = ["scheduled", "played", "postponed", "cancelled"] as const;

export const createMatchSchema = z
  .object({
    homeTeamId: z.string().uuid(),
    awayTeamId: z.string().uuid(),
    fieldId: z.string().uuid(),
    matchday: z.number().int().min(1),
    date: z.coerce.date(),
    time: z.string().regex(timeFormat, "Invalid time format (HH:mm)"),
  })
  .refine((data) => data.homeTeamId !== data.awayTeamId, {
    message: "Home team and away team must be different",
    path: ["awayTeamId"],
  });
export type CreateMatchDto = z.infer<typeof createMatchSchema>;

export const updateMatchSchema = z.object({
  fieldId: z.string().uuid().optional(),
  matchday: z.number().int().min(1).optional(),
  date: z.coerce.date().optional(),
  time: z.string().regex(timeFormat, "Invalid time format (HH:mm)").optional(),
  status: z.enum(matchStatusValues).optional(),
});
export type UpdateMatchDto = z.infer<typeof updateMatchSchema>;

export const registerResultSchema = z.object({
  homeGoals: z.number().int().min(0),
  awayGoals: z.number().int().min(0),
});
export type RegisterResultDto = z.infer<typeof registerResultSchema>;

export const listMatchesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  matchday: z.coerce.number().int().min(1).optional(),
  teamId: z.string().uuid().optional(),
  status: z.enum(matchStatusValues).optional(),
});
export type ListMatchesQuery = z.infer<typeof listMatchesQuerySchema>;
