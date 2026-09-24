import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/auth/session";
import { refreshSessionService } from "@/modules/auth/server/refresh-session.service";
import { withErrorHandling } from "@/lib/middleware/error-handler";

export const POST = withErrorHandling(async (req: NextRequest) => {
  await refreshSessionService.revoke(req.cookies.get(REFRESH_COOKIE_NAME)?.value);
  const res = NextResponse.json({ success: true, data: null });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return res;
});
