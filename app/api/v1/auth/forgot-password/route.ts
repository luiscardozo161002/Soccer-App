import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { authService } from "@/lib/services/auth.service";
import { forgotPasswordSchema } from "@/lib/validation/auth.schema";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const dto = forgotPasswordSchema.parse(await req.json());
  const token = await authService.requestPasswordReset(dto.identifier);

  // `token` is only non-null when email delivery isn't configured (RESEND_API_KEY
  // / EMAIL_FROM missing, e.g. local dev) — see authService.requestPasswordReset.
  // Once configured, the reset link goes to the account's own inbox instead,
  // and this always responds with resetUrl: null.
  return ok({ resetUrl: token ? `/reset-password?token=${token}` : null });
});
