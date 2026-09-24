import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { getSession } from "@/lib/auth/session";
import { assertAdmin } from "@/lib/auth/match-access";
import { sanctionService } from "@/modules/sanctions/server/sanction.service";
import { updateSanctionSchema } from "@/modules/sanctions/sanction.schema";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  const sanction = await sanctionService.getById(id);
  return ok(sanction);
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  assertAdmin(await getSession(req));
  const { id } = await params;
  const dto = updateSanctionSchema.parse(await req.json());
  const sanction = await sanctionService.update(id, dto);
  return ok(sanction, { message: "Sanction updated" });
});
