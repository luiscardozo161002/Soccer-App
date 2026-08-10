import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { teamService } from "@/lib/services/team.service";
import { createTeamSchema, listTeamsQuerySchema } from "@/lib/validation/team.schema";

export const GET = withErrorHandling(async (req) => {
  const query = listTeamsQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  const { items, totalItems, totalPages } = await teamService.list(
    query.page,
    query.pageSize
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
  const dto = createTeamSchema.parse(await req.json());
  const team = await teamService.create(dto);
  return ok(team, { status: 201, message: "Team created" });
});
