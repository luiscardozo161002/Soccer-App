import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { settingsService } from "@/lib/services/settings.service";
import { updateSettingsSchema } from "@/lib/validation/settings.schema";

export const GET = withErrorHandling(async () => {
  const settings = await settingsService.get();
  return ok(settings);
});

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const dto = updateSettingsSchema.parse(await req.json());
  const settings = await settingsService.update(dto);
  return ok(settings, { message: "Settings updated" });
});
