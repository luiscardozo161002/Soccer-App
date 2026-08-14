import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { cardService } from "@/lib/services/card.service";

export const POST = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  const card = await cardService.payFine(id);
  return ok(card, { message: "Multa pagada" });
});
