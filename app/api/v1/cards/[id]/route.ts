import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok, noContent } from "@/lib/http/api-response";
import { cardService } from "@/lib/services/card.service";
import { updateCardSchema } from "@/lib/validation/card.schema";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  const card = await cardService.getById(id);
  return ok(card);
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const dto = updateCardSchema.parse(await req.json());
  const card = await cardService.update(id, dto);
  return ok(card, { message: "Card updated" });
});

export const DELETE = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  await cardService.remove(id);
  return noContent();
});
