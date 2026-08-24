import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { getSession } from "@/lib/auth/session";
import { assertMatchAccess } from "@/lib/auth/match-access";
import { matchService } from "@/lib/services/match.service";
import { matchEvidenceService } from "@/lib/services/match-evidence.service";
import { uploadMatchEvidenceSchema } from "@/lib/validation/match-evidence.schema";
import { ApiError } from "@/lib/errors";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const match = await matchService.getById(id);
  const session = await getSession(req);
  assertMatchAccess(session, match);
  const evidence = await matchEvidenceService.listForMatch(id);
  return ok(evidence);
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const match = await matchService.getById(id);
  const session = await getSession(req);
  assertMatchAccess(session, match);
  if (!session) {
    throw new ApiError(401, "UNAUTHORIZED", "Inicia sesión para continuar");
  }
  const dto = uploadMatchEvidenceSchema.parse(await req.json());
  const evidence = await matchEvidenceService.upload(id, dto, session.sub, session.role === "admin");
  return ok(evidence, { status: 201, message: "Evidence uploaded" });
});
