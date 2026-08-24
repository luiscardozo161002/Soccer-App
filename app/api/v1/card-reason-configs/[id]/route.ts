import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { getSession } from "@/lib/auth/session";
import { assertAdmin } from "@/lib/auth/match-access";
import { cardReasonConfigService } from "@/lib/services/card-reason-config.service";
import { updateCardReasonConfigSchema } from "@/lib/validation/card-reason-config.schema";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  const config = await cardReasonConfigService.getById(id);
  return ok(config);
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const session = await getSession(req);
  assertAdmin(session);
  const { id } = await params;
  const dto = updateCardReasonConfigSchema.parse(await req.json());
  const config = await cardReasonConfigService.update(id, dto);
  return ok(config, { message: "Card reason config updated" });
});
