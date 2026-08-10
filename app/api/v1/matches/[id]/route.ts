import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok, noContent } from "@/lib/http/api-response";
import { matchService } from "@/lib/services/match.service";
import { updateMatchSchema } from "@/lib/validation/match.schema";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  const match = await matchService.getById(id);
  return ok(match);
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const dto = updateMatchSchema.parse(await req.json());
  const match = await matchService.update(id, dto);
  return ok(match, { message: "Match updated" });
});

export const DELETE = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  await matchService.remove(id);
  return noContent();
});
