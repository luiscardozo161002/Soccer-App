import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/security/rate-limit";

// GET on /api/v1/* stays public (the landing page needs it); only writes
// require a session. /api/v1/users is the exception — it lists admin
// accounts, so it needs a session even for GET.
const ALWAYS_PROTECTED_API_PREFIXES = ["/api/v1/users"];

function envInt(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

// Brute-force/spam protection for the 3 auth endpoints that don't require a
// session to hit. Keyed by IP, one counter per path.
const AUTH_RATE_LIMITS: Record<string, { limit: number; windowSeconds: number }> = {
  "/api/v1/auth/login": {
    limit: envInt("LOGIN_RATE_LIMIT", 5),
    windowSeconds: envInt("LOGIN_RATE_WINDOW_SECONDS", 15 * 60),
  },
  "/api/v1/auth/forgot-password": {
    limit: envInt("FORGOT_PASSWORD_RATE_LIMIT", 3),
    windowSeconds: envInt("FORGOT_PASSWORD_RATE_WINDOW_SECONDS", 15 * 60),
  },
  "/api/v1/auth/reset-password": {
    limit: envInt("RESET_PASSWORD_RATE_LIMIT", 5),
    windowSeconds: envInt("RESET_PASSWORD_RATE_WINDOW_SECONDS", 15 * 60),
  },
};

function clientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const authLimit = req.method === "POST" ? AUTH_RATE_LIMITS[pathname] : undefined;
  if (authLimit) {
    const ip = clientIp(req);
    const { allowed, retryAfterSeconds } = await checkRateLimit(
      `ratelimit:${pathname}:${ip}`,
      authLimit.limit,
      authLimit.windowSeconds
    );
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "RATE_LIMITED", message: "Demasiados intentos, intenta de nuevo más tarde", details: null },
        },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
      );
    }
  }

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
