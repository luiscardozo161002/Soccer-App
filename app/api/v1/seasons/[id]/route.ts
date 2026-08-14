import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { seasonService } from "@/lib/services/season.service";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  const season = await seasonService.getById(id);
  return ok(season);
});
