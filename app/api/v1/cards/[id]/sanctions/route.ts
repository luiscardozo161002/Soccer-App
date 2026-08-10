import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { sanctionService } from "@/lib/services/sanction.service";
import { createSanctionSchema } from "@/lib/validation/sanction.schema";

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const dto = createSanctionSchema.parse(await req.json());
  const sanction = await sanctionService.createForCard(id, dto);
  return ok(sanction, { status: 201, message: "Sanction created" });
});
