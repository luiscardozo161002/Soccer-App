import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { sanctionService } from "@/modules/sanctions/server/sanction.service";
import { listSanctionsQuerySchema } from "@/modules/sanctions/sanction.schema";

export const GET = withErrorHandling(async (req) => {
  const query = listSanctionsQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  const { items, totalItems, totalPages } = await sanctionService.list(query);

  return ok(items, {
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      totalItems,
      totalPages,
    },
  });
});
