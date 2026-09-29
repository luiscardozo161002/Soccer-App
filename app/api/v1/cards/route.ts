import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { getSession } from "@/lib/auth/session";
import { assertEvidenceAccess } from "@/lib/auth/match-access";
import { matchService } from "@/modules/matches/server/match.service";
import { cardService } from "@/modules/cards/server/card.service";
import { createCardSchema, listCardsQuerySchema } from "@/modules/cards/card.schema";

export const GET = withErrorHandling(async (req) => {
  const query = listCardsQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  const { items, totalItems, totalPages } = await cardService.list(query);

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
  const dto = createCardSchema.parse(await req.json());
  const match = await matchService.getById(dto.matchId);
  assertEvidenceAccess(session, match);
  const card = await cardService.create(dto);
  return ok(card, { status: 201, message: "Card created" });
});
