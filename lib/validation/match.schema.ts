import { z } from "zod";
import { pageSizeSchema } from "@/lib/validation/pagination";
import { MIN_MATCH_TIME, MAX_MATCH_TIME, isWithinMatchTimeWindow } from "@/lib/constants/match-time";

const timeFormat = /^([01]\d|2[0-3]):[0-5]\d$/;
const matchTimeSchema = z
  .string()
  .regex(timeFormat, "Invalid time format (HH:mm)")
  .refine(isWithinMatchTimeWindow, {
    message: `Match time must be between ${MIN_MATCH_TIME} and ${MAX_MATCH_TIME}`,
  });
const matchStatusValues = ["scheduled", "played", "postponed", "cancelled"] as const;
const leagueCategoryValues = ["primera_division", "division_ascenso", "segunda_division"] as const;
// "played" is excluded: a match only reaches it via /result (goals + time),
// never a plain status edit — that used to leave "played" matches with no score.
const editableStatusValues = ["scheduled", "postponed", "cancelled"] as const;

export const createMatchSchema = z
  .object({
    homeTeamId: z.string().uuid(),
    awayTeamId: z.string().uuid(),
    fieldId: z.string().uuid(),
    matchday: z.number().int().min(1),
    date: z.coerce.date(),
    time: matchTimeSchema.optional(),
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
  time: matchTimeSchema.optional(),
  status: z.enum(editableStatusValues).optional(),
  statusReason: z.string().trim().max(300).optional(),
});
export type UpdateMatchDto = z.infer<typeof updateMatchSchema>;

export const registerResultSchema = z.object({
  homeGoals: z.number().int().min(0),
  awayGoals: z.number().int().min(0),
  forfeit: z.boolean().optional(),
  forfeitReason: z.string().trim().max(300).optional(),
});
export type RegisterResultDto = z.infer<typeof registerResultSchema>;

export const listMatchesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: pageSizeSchema,
  matchday: z.coerce.number().int().min(1).optional(),
  teamId: z.string().uuid().optional(),
  status: z.enum(matchStatusValues).optional(),
  seasonId: z.string().uuid().optional(),
  category: z.enum(leagueCategoryValues).optional(),
});
export type ListMatchesQuery = z.infer<typeof listMatchesQuerySchema>;
