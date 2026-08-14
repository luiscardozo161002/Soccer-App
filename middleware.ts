import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

// GET requests to /api/v1/* stay public — the landing page reads teams,
// matches, standings and fields without a session. Only writes (and the
// /admin pages themselves) require a session. /api/v1/users is the
// exception: it lists usernames/emails/roles, so it needs a session even
// for GET.
const ALWAYS_PROTECTED_API_PREFIXES = ["/api/v1/users"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const session = await getSession(req);
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/v1/") && !pathname.startsWith("/api/v1/auth/")) {
    const alwaysProtected = ALWAYS_PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));
    if (alwaysProtected || req.method !== "GET") {
      const session = await getSession(req);
      if (!session) {
        return NextResponse.json(
          { success: false, error: { code: "UNAUTHORIZED", message: "Inicia sesión para continuar", details: null } },
          { status: 401 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/v1/:path*"],
};
