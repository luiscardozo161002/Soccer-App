import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { matchService } from "@/lib/services/match.service";
import { registerResultSchema } from "@/lib/validation/match.schema";

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const dto = registerResultSchema.parse(await req.json());
  const match = await matchService.registerResult(id, dto);
  return ok(match, { message: "Result recorded" });
});
