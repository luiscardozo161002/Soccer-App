import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { settingsService } from "@/modules/settings/server/settings.service";
import { updateSettingsSchema } from "@/modules/settings/settings.schema";
import { getSession } from "@/lib/auth/session";
import { assertAdmin } from "@/lib/auth/match-access";

export const GET = withErrorHandling(async () => {
  const settings = await settingsService.get();
  return ok(settings);
});

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  assertAdmin(await getSession(req));
  const dto = updateSettingsSchema.parse(await req.json());
  const settings = await settingsService.update(dto);
  return ok(settings, { message: "Settings updated" });
});
