import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { seasonService } from "@/modules/seasons/server/season.service";

export const GET = withErrorHandling(async () => {
  const seasons = await seasonService.list();
  return ok(seasons);
});
