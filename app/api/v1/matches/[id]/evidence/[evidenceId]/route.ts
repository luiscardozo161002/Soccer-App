import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { noContent } from "@/lib/http/api-response";
import { getSession } from "@/lib/auth/session";
import { assertMatchAccess } from "@/lib/auth/match-access";
import { matchService } from "@/lib/services/match.service";
import { matchEvidenceService } from "@/lib/services/match-evidence.service";

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id, evidenceId } = await params;
  const match = await matchService.getById(id);
  const session = await getSession(req);
  assertMatchAccess(session, match);
  await matchEvidenceService.remove(id, evidenceId, session?.role === "admin");
  return noContent();
});
