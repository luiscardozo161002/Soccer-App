import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE_NAME, REFRESH_MAX_AGE_SECONDS, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { refreshSessionService } from "@/modules/auth/server/refresh-session.service";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ApiError } from "@/lib/errors";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const allowedOrigin = new URL(process.env.APP_URL ?? req.url).origin;
  if (origin && origin !== allowedOrigin) {
    throw new ApiError(403, "FORBIDDEN", "Origen no permitido");
  }
  const current = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!current) throw new ApiError(401, "SESSION_EXPIRED", "Tu sesión terminó. Inicia sesión nuevamente.");

  const { accessToken, refreshToken } = await refreshSessionService.rotate(current);
  const response = NextResponse.json({ success: true, data: null }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(SESSION_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
  return response;
});
