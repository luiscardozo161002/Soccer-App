import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { getSession } from "@/lib/auth/session";
import { assertAdmin } from "@/lib/auth/match-access";
import { sanctionService } from "@/modules/sanctions/server/sanction.service";
import { createSanctionSchema } from "@/modules/sanctions/sanction.schema";

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  assertAdmin(await getSession(req));
  const { id } = await params;
  const dto = createSanctionSchema.parse(await req.json());
  const sanction = await sanctionService.createForCard(id, dto);
  return ok(sanction, { status: 201, message: "Sanction created" });
});
