import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok, noContent } from "@/lib/http/api-response";
import { getSession } from "@/lib/auth/session";
import { assertMatchAccess, assertAdmin } from "@/lib/auth/match-access";
import { matchService } from "@/lib/services/match.service";
import { updateMatchSchema } from "@/lib/validation/match.schema";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const match = await matchService.getById(id);
  const session = await getSession(req);
  assertMatchAccess(session, match);
  return ok(match);
});

// General editing (reschedule, postpone, cancel) stays admin-only — an
// assigned referee may only register a result via /result, not reshape
// the match itself.
export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const session = await getSession(req);
  assertAdmin(session);
  const { id } = await params;
  const dto = updateMatchSchema.parse(await req.json());
  const match = await matchService.update(id, dto);
  return ok(match, { message: "Match updated" });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  const session = await getSession(req);
  assertAdmin(session);
  const { id } = await params;
  await matchService.remove(id);
  return noContent();
});
