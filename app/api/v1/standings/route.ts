import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { standingsService } from "@/lib/services/standings.service";

export const GET = withErrorHandling(async () => {
  const standings = await standingsService.list();
  return ok(standings);
});
