import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { standingsService } from "@/lib/services/standings.service";

export const GET = withErrorHandling(async (req) => {
  const seasonId = req.nextUrl.searchParams.get("seasonId") ?? undefined;
  const standings = await standingsService.list(seasonId);
  return ok(standings);
});
