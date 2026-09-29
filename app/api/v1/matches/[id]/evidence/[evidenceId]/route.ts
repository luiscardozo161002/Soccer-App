import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { noContent } from "@/lib/http/api-response";
import { getSession } from "@/lib/auth/session";
import { assertEvidenceAccess } from "@/lib/auth/match-access";
import { matchService } from "@/modules/matches/server/match.service";
import { matchEvidenceService } from "@/modules/matches/server/match-evidence.service";

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id, evidenceId } = await params;
  const match = await matchService.getById(id);
  const session = await getSession(req);
  assertEvidenceAccess(session, match);
  await matchEvidenceService.remove(id, evidenceId);
  return noContent();
});
