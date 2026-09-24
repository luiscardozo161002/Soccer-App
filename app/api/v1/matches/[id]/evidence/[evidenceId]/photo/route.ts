import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { getSession } from "@/lib/auth/session";
import { assertEvidenceAccess } from "@/lib/auth/match-access";
import { matchService } from "@/modules/matches/server/match.service";
import { matchEvidenceRepository } from "@/modules/matches/server/match-evidence.repository";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id, evidenceId } = await params;
  const match = await matchService.getById(id);
  const session = await getSession(req);
  assertEvidenceAccess(session, match);

  const record = await matchEvidenceRepository.findPhoto(evidenceId);
  if (!record || record.matchId !== id) {
    return NextResponse.json(
      { success: false, error: { code: "MATCH_EVIDENCE_NOT_FOUND", message: "No existe esa evidencia", details: null } },
      { status: 404 }
    );
  }

  return new NextResponse(new Uint8Array(record.photo), {
    headers: {
      "Content-Type": record.photoType,
      "Cache-Control": "private, no-store",
    },
  });
});
