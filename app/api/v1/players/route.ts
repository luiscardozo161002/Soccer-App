import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { playerService } from "@/lib/services/player.service";
import { createPlayerSchema, listPlayersQuerySchema } from "@/lib/validation/player.schema";

export const GET = withErrorHandling(async (req) => {
  const query = listPlayersQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  const { items, totalItems, totalPages } = await playerService.list(
    query.page,
    query.pageSize,
    query.teamId
  );

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
  const dto = createPlayerSchema.parse(await req.json());
  const player = await playerService.create(dto);
  return ok(player, { status: 201, message: "Player created" });
});
