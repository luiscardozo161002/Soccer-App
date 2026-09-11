import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { getSession } from "@/lib/auth/session";
import { assertAdmin } from "@/lib/auth/match-access";
import { matchService } from "@/lib/services/match.service";
import type { NextRequest } from "next/server";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await getSession(req);
  assertAdmin(session);
  const latest = await matchService.getLatestMatchday();
  return ok(latest);
});
