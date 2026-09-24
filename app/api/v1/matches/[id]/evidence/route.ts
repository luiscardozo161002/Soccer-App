import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { getSession } from "@/lib/auth/session";
import { assertEvidenceAccess } from "@/lib/auth/match-access";
import { matchService } from "@/modules/matches/server/match.service";
import { matchEvidenceService } from "@/modules/matches/server/match-evidence.service";
import { uploadMatchEvidenceSchema } from "@/modules/matches/match-evidence.schema";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const match = await matchService.getById(id);
  const session = await getSession(req);
  assertEvidenceAccess(session, match);
  const evidence = await matchEvidenceService.listForMatch(id);
  return ok(evidence);
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const match = await matchService.getById(id);
  const session = await getSession(req);
  assertEvidenceAccess(session, match);
  const dto = uploadMatchEvidenceSchema.parse(await req.json());
  const evidence = await matchEvidenceService.upload(id, dto, session.sub, session.role === "admin");
  return ok(evidence, { status: 201, message: "Evidence uploaded" });
});
