import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { seasonService } from "@/modules/seasons/server/season.service";
import { updateSeasonSchema } from "@/modules/seasons/season.schema";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  const season = await seasonService.getById(id);
  return ok(season);
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const dto = updateSeasonSchema.parse(await req.json());
  const season = await seasonService.update(id, dto);
  return ok(season, { message: "Season updated" });
});
