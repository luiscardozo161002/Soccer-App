import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { cupEntryService } from "@/lib/services/cup-entry.service";
import { createCupEntriesSchema, listCupEntriesQuerySchema } from "@/lib/validation/cup-entry.schema";

export const GET = withErrorHandling(async (req) => {
  const query = listCupEntriesQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  const { items, totalItems, totalPages } = await cupEntryService.list(query.cupId, query.page, query.pageSize);
  return ok(items, { meta: { page: query.page, pageSize: query.pageSize, totalItems, totalPages } });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const dto = createCupEntriesSchema.parse(await req.json());
  await cupEntryService.addTeams(dto);
  return ok(null, { status: 201, message: "Equipos inscritos" });
});
