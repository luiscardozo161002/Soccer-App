import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { authService } from "@/lib/services/auth.service";
import { loginSchema } from "@/lib/validation/auth.schema";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const dto = loginSchema.parse(await req.json());
  const { token, user } = await authService.login(dto.username, dto.password);

  const res = NextResponse.json({ success: true, data: user });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
});
