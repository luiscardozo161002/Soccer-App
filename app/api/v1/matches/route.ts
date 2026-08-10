import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { matchService } from "@/lib/services/match.service";
import { createMatchSchema, listMatchesQuerySchema } from "@/lib/validation/match.schema";

export const GET = withErrorHandling(async (req) => {
  const query = listMatchesQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
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
  const dto = createMatchSchema.parse(await req.json());
  const match = await matchService.create(dto);
  return ok(match, { status: 201, message: "Match created" });
});
