import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { authService } from "@/lib/services/auth.service";
import { forgotPasswordSchema } from "@/lib/validation/auth.schema";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const dto = forgotPasswordSchema.parse(await req.json());
  const token = await authService.requestPasswordReset(dto.identifier);

  // TEMPORARY: no email provider is configured yet (see RESEND_API_KEY in
  // .env.example), so the reset link is handed back in the response instead
  // of being emailed. This must be replaced with real email delivery before
  // any real-world deployment — returning a live reset token to whoever
  // submits a username/email is an account-takeover vector otherwise.
  return ok({ resetUrl: token ? `/reset-password?token=${token}` : null });
});
