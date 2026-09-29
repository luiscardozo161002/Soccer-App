import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { getSession } from "@/lib/auth/session";
import { assertAdmin } from "@/lib/auth/match-access";
import { matchService } from "@/modules/matches/server/match.service";
import { archiveMatchSchema } from "@/modules/matches/match.schema";

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const session = await getSession(req);
  assertAdmin(session);
  const { id } = await params;
  const { archived } = archiveMatchSchema.parse(await req.json());
  const match = await matchService.archive(id, archived);
  return ok(match, { message: archived ? "Match archived" : "Match unarchived" });
});
