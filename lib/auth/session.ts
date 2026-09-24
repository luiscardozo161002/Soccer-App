import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE_SECONDS = 15 * 60;
export const REFRESH_COOKIE_NAME = "session_refresh";
export const REFRESH_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  sub: string;
  sid: string;
  username: string;
  role: string;
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ sid: payload.sid, username: payload.username, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.sub !== "string" || typeof payload.sid !== "string" || typeof payload.username !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return { sub: payload.sub, sid: payload.sid, username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}

export async function getSession(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? await verifySessionToken(token) : null;
  if (!payload) return null;
  const session = await prisma.refreshSession.findUnique({
    where: { id: payload.sid },
    include: { user: true },
  });
  if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== "active") {
    return null;
  }
  return { ...payload, username: session.user.username, role: session.user.role };
}
