import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { getSession } from "@/lib/auth/session";
import { assertAdmin } from "@/lib/auth/match-access";
import { cardService } from "@/modules/cards/server/card.service";

export const POST = withErrorHandling(async (req, { params }) => {
  assertAdmin(await getSession(req));
  const { id } = await params;
  const card = await cardService.payFine(id);
  return ok(card, { message: "Multa pagada" });
});
