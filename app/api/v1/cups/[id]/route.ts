import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { cupService } from "@/lib/services/cup.service";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  const cup = await cupService.getById(id);
  return ok(cup);
});
