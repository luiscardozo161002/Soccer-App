import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { fieldService } from "@/lib/services/field.service";
import { createFieldSchema, listFieldsQuerySchema } from "@/lib/validation/field.schema";

export const GET = withErrorHandling(async (req) => {
  const query = listFieldsQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  const { items, totalItems, totalPages } = await fieldService.list(
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
  const dto = createFieldSchema.parse(await req.json());
  const field = await fieldService.create(dto);
  return ok(field, { status: 201, message: "Field created" });
});
