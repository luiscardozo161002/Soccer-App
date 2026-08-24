import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { getSession } from "@/lib/auth/session";
import { assertAdmin } from "@/lib/auth/match-access";
import { matchService } from "@/lib/services/match.service";
import { createMatchSchema, listMatchesQuerySchema } from "@/lib/validation/match.schema";

export const GET = withErrorHandling(async (req) => {
  const query = listMatchesQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  const session = await getSession(req);
  // A referee only ever sees their own assigned matches — the client's
  // refereeId (if any) is discarded, not merely validated.
  if (session?.role === "arbitro") {
    query.refereeId = session.sub;
  }
  const { items, totalItems, totalPages } = await matchService.list(query);

  return ok(items, {
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      totalItems,
      totalPages,
    },
  });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await getSession(req);
  assertAdmin(session);
  const dto = createMatchSchema.parse(await req.json());
  const match = await matchService.create(dto);
  return ok(match, { status: 201, message: "Match created" });
});
