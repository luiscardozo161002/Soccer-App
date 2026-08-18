import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { cupMatchService } from "@/lib/services/cup-match.service";
import { createCupMatchSchema, listCupMatchesQuerySchema } from "@/lib/validation/cup-match.schema";

export const GET = withErrorHandling(async (req) => {
  const query = listCupMatchesQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  const matches = await cupMatchService.list(query);
  return ok(matches);
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const dto = createCupMatchSchema.parse(await req.json());
  const match = await cupMatchService.create(dto);
  return ok(match, { status: 201, message: "Cup match created" });
});
