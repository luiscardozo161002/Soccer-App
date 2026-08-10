import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok, noContent } from "@/lib/http/api-response";
import { teamService } from "@/lib/services/team.service";
import { updateTeamSchema } from "@/lib/validation/team.schema";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  const team = await teamService.getById(id);
  return ok(team);
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const dto = updateTeamSchema.parse(await req.json());
  const team = await teamService.update(id, dto);
  return ok(team, { message: "Team updated" });
});

export const DELETE = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  await teamService.remove(id);
  return noContent();
});
