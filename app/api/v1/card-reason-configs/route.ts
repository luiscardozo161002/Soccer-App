import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { getSession } from "@/lib/auth/session";
import { assertAdmin } from "@/lib/auth/match-access";
import { cardReasonConfigService } from "@/modules/cards/server/card-reason-config.service";
import { createCardReasonConfigSchema, listCardReasonConfigsQuerySchema } from "@/modules/cards/card-reason-config.schema";


export const GET = withErrorHandling(async (req) => {
  const query = listCardReasonConfigsQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  const { items, totalItems, totalPages } = await cardReasonConfigService.list(query);
  return ok(items, {
    meta: { page: query.page, pageSize: query.pageSize, totalItems, totalPages },
  });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await getSession(req);
  assertAdmin(session);
  const dto = createCardReasonConfigSchema.parse(await req.json());
  const config = await cardReasonConfigService.create(dto);
  return ok(config, { status: 201, message: "Card reason config created" });
});
