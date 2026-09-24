import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { getSession } from "@/lib/auth/session";
import { assertAdmin } from "@/lib/auth/match-access";
import { sanctionService } from "@/modules/sanctions/server/sanction.service";

export const POST = withErrorHandling(async (req, { params }) => {
  assertAdmin(await getSession(req));
  const { id } = await params;
  const sanction = await sanctionService.payFine(id);
  return ok(sanction, { message: "Multa pagada, sanción levantada" });
});
