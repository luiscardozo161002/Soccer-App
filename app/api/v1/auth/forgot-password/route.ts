import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { authService } from "@/lib/services/auth.service";
import { forgotPasswordSchema } from "@/lib/validation/auth.schema";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const dto = forgotPasswordSchema.parse(await req.json());
  const token = await authService.requestPasswordReset(dto.identifier);

  // `token` is only non-null without email delivery configured (local dev);
  // once configured the link goes to the inbox and this returns null.
  return ok({ resetUrl: token ? `/reset-password?token=${token}` : null });
});
