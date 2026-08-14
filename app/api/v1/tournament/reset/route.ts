import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { tournamentService } from "@/lib/services/tournament.service";

export const POST = withErrorHandling(async () => {
  const newSeason = await tournamentService.reset();
  return ok(newSeason, { message: "Torneo reiniciado" });
});
