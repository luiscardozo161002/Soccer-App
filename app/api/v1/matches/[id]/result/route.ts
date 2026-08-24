import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { getSession } from "@/lib/auth/session";
import { assertMatchAccess } from "@/lib/auth/match-access";
import { matchService } from "@/lib/services/match.service";
import { registerResultSchema } from "@/lib/validation/match.schema";
import { ApiError } from "@/lib/errors";

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const existing = await matchService.getById(id);
  const session = await getSession(req);
  assertMatchAccess(session, existing);
  if (!session) {
    throw new ApiError(401, "UNAUTHORIZED", "Inicia sesión para continuar");
  }
  const dto = registerResultSchema.parse(await req.json());
  const match = await matchService.registerResult(id, dto, {
    userId: session.sub,
    isAdmin: session.role === "admin",
  });
  return ok(match, { message: "Result recorded" });
});
