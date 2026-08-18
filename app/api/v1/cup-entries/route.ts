import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { cupEntryService } from "@/lib/services/cup-entry.service";
import { createCupEntriesSchema, listCupEntriesQuerySchema } from "@/lib/validation/cup-entry.schema";

export const GET = withErrorHandling(async (req) => {
  const query = listCupEntriesQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  const entries = await cupEntryService.list(query.cupId);
  return ok(entries);
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const dto = createCupEntriesSchema.parse(await req.json());
  await cupEntryService.addTeams(dto);
  const entries = await cupEntryService.list(dto.cupId);
  return ok(entries, { status: 201, message: "Equipos inscritos" });
});
