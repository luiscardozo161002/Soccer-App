import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok, noContent } from "@/lib/http/api-response";
import { equipoService } from "@/lib/services/equipo.service";
import { updateEquipoSchema } from "@/lib/validation/equipo.schema";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  const equipo = await equipoService.getById(id);
  return ok(equipo);
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const dto = updateEquipoSchema.parse(await req.json());
  const equipo = await equipoService.update(id, dto);
  return ok(equipo, { message: "Equipo actualizado" });
});

export const DELETE = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  await equipoService.remove(id);
  return noContent();
});
