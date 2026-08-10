import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok, noContent } from "@/lib/http/api-response";
import { fieldService } from "@/lib/services/field.service";
import { updateFieldSchema } from "@/lib/validation/field.schema";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  const field = await fieldService.getById(id);
  return ok(field);
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const dto = updateFieldSchema.parse(await req.json());
  const field = await fieldService.update(id, dto);
  return ok(field, { message: "Field updated" });
});

export const DELETE = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  await fieldService.remove(id);
  return noContent();
});
