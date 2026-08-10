import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { cardService } from "@/lib/services/card.service";
import { createCardSchema, listCardsQuerySchema } from "@/lib/validation/card.schema";

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
  const dto = createCardSchema.parse(await req.json());
  const card = await cardService.create(dto);
  return ok(card, { status: 201, message: "Card created" });
});
