import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { authService } from "@/modules/auth/server/auth.service";
import { resetPasswordSchema } from "@/modules/auth/auth.schema";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const dto = resetPasswordSchema.parse(await req.json());
  await authService.resetPassword(dto.token, dto.password);
  return ok(null, { message: "Contraseña actualizada" });
});
