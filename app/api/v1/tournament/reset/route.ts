import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { tournamentService } from "@/modules/seasons/server/tournament.service";

export const POST = withErrorHandling(async () => {
  const newSeason = await tournamentService.reset();
  return ok(newSeason, { message: "Torneo reiniciado" });
});
