import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { sanctionService } from "@/lib/services/sanction.service";

export const POST = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  const sanction = await sanctionService.payFine(id);
  return ok(sanction, { message: "Multa pagada, sanción levantada" });
});
