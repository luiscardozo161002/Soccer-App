import { NextRequest, NextResponse } from "next/server";
import { getSession, REFRESH_COOKIE_NAME } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { refreshSessionRepository } from "@/modules/auth/server/refresh-session.repository";

// GET on /api/v1/* stays public (the landing page needs it); only writes
// require a session. /api/v1/users is the exception — it lists admin
// accounts, so it needs a session even for GET.
const ALWAYS_PROTECTED_API_PREFIXES = ["/api/v1/users"];

// A referee can write match results/evidence and create/edit/delete match cards.
// Every other write endpoint (teams, players, users, settings, sanctions, ...)
// is off-limits. The routes verify assignment to the individual match.
// getSession checks the current user role in
// the database, so a role change takes effect on the next request.
const ARBITRO_WRITE_PREFIX = "/api/v1/matches/";
const ARBITRO_PAGE_PREFIX = "/admin/my-matches";

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
    const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
    const refreshUser = !session && refreshToken
      ? await refreshSessionRepository.findActiveUser(refreshToken)
      : null;
    if (!session && !refreshUser) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const role = session?.role ?? refreshUser?.role;
    if (role !== "admin" && role !== "arbitro") {
      return new NextResponse(null, { status: 403 });
    }
    if (role === "arbitro" && pathname !== ARBITRO_PAGE_PREFIX && !pathname.startsWith(`${ARBITRO_PAGE_PREFIX}/`)) {
      return NextResponse.redirect(new URL(ARBITRO_PAGE_PREFIX, req.url));
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
      if (session.role !== "admin" && session.role !== "arbitro") {
        return NextResponse.json(
          { success: false, error: { code: "FORBIDDEN", message: "No tienes permiso para esta acción", details: null } },
          { status: 403 }
        );
      }
      const refereeCardWrite = (req.method === "POST" && pathname === "/api/v1/cards") ||
        (["PATCH", "DELETE"].includes(req.method) && /^\/api\/v1\/cards\/[^/]+$/.test(pathname));
      if (session.role === "arbitro" && req.method !== "GET" &&
          !pathname.startsWith(ARBITRO_WRITE_PREFIX) && !refereeCardWrite) {
        return NextResponse.json(
          { success: false, error: { code: "FORBIDDEN", message: "No tienes permiso para esta acción", details: null } },
          { status: 403 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/v1/:path*"],
};
