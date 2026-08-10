import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok, noContent } from "@/lib/http/api-response";
import { playerService } from "@/lib/services/player.service";
import { updatePlayerSchema } from "@/lib/validation/player.schema";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  const player = await playerService.getById(id);
  return ok(player);
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const dto = updatePlayerSchema.parse(await req.json());
  const player = await playerService.update(id, dto);
  return ok(player, { message: "Player updated" });
});

export const DELETE = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  await playerService.remove(id);
  return noContent();
});
