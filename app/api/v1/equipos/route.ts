import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { equipoService } from "@/lib/services/equipo.service";
import { createEquipoSchema, listEquiposQuerySchema } from "@/lib/validation/equipo.schema";

export const GET = withErrorHandling(async (req) => {
  const query = listEquiposQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  const { items, totalItems, totalPages } = await equipoService.list(
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
  const dto = createEquipoSchema.parse(await req.json());
  const equipo = await equipoService.create(dto);
  return ok(equipo, { status: 201, message: "Equipo creado" });
});
