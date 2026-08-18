import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { cupEntryService } from "@/lib/services/cup-entry.service";
import { withdrawCupEntrySchema } from "@/lib/validation/cup-entry.schema";

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const dto = withdrawCupEntrySchema.parse(await req.json());
  const entry = await cupEntryService.withdraw(id, dto);
  return ok(entry, { message: "Equipo retirado de la copa" });
});
