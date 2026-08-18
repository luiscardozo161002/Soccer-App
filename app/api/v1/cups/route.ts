import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { cupService } from "@/lib/services/cup.service";
import { createCupSchema } from "@/lib/validation/cup.schema";

export const GET = withErrorHandling(async () => {
  const cups = await cupService.list();
  return ok(cups);
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const dto = createCupSchema.parse(await req.json());
  const cup = await cupService.create(dto);
  return ok(cup, { status: 201, message: "Cup created" });
});
