import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { cupMatchService } from "@/lib/services/cup-match.service";

export const POST = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  const match = await cupMatchService.reopen(id);
  return ok(match, { message: "Resultado reabierto" });
});
