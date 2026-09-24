import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { authService } from "@/modules/auth/server/auth.service";
import { forgotPasswordSchema } from "@/modules/auth/auth.schema";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const dto = forgotPasswordSchema.parse(await req.json());
  const token = await authService.requestPasswordReset(dto.identifier);

  return ok({ resetUrl: token ? `/reset-password?token=${token}` : null });
});
