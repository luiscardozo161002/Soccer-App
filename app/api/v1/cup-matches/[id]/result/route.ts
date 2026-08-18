import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { cupMatchService } from "@/lib/services/cup-match.service";
import { registerCupResultSchema } from "@/lib/validation/cup-match.schema";

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const dto = registerCupResultSchema.parse(await req.json());
  const match = await cupMatchService.registerResult(id, dto);
  return ok(match, { message: "Result recorded" });
});
