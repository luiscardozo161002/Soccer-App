import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { playerService } from "@/lib/services/player.service";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  const eligibility = await playerService.getEligibility(id);
  return ok(eligibility);
});
