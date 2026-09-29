import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok, noContent } from "@/lib/http/api-response";
import { getSession } from "@/lib/auth/session";
import { assertAdmin, assertEvidenceAccess } from "@/lib/auth/match-access";
import { cardService } from "@/modules/cards/server/card.service";
import { updateCardDetailsSchema, updateCardSchema } from "@/modules/cards/card.schema";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  const card = await cardService.getById(id);
  return ok(card);
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const session = await getSession(req);
  const { id } = await params;
  const body: unknown = await req.json();
  let card;
  if (body !== null && typeof body === "object" && "paid" in body) {
    assertAdmin(session);
    card = await cardService.update(id, updateCardSchema.parse(body));
  } else {
    const existing = await cardService.getById(id);
    assertEvidenceAccess(session, existing.match);
    card = await cardService.updateDetails(id, updateCardDetailsSchema.parse(body));
  }
  return ok(card, { message: "Card updated" });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  const session = await getSession(req);
  const { id } = await params;
  const card = await cardService.getById(id);
  assertEvidenceAccess(session, card.match);
  await cardService.remove(id);
  return noContent();
});
