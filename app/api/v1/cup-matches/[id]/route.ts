import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok, noContent } from "@/lib/http/api-response";
import { cupMatchService } from "@/lib/services/cup-match.service";
import { updateCupMatchSchema } from "@/lib/validation/cup-match.schema";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  const match = await cupMatchService.getById(id);
  return ok(match);
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const dto = updateCupMatchSchema.parse(await req.json());
  const match = await cupMatchService.update(id, dto);
  return ok(match, { message: "Cup match updated" });
});

export const DELETE = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  await cupMatchService.remove(id);
  return noContent();
});
