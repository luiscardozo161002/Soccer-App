import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function newRefreshToken() {
  return randomBytes(32).toString("base64url");
}

const refreshLifetimeMs = 30 * 24 * 60 * 60 * 1000;

export const refreshSessionRepository = {
  async findActiveUser(token: string) {
    const session = await prisma.refreshSession.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        revokedAt: true,
        expiresAt: true,
        user: { select: { id: true, username: true, role: true, status: true } },
      },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== "active") {
      return null;
    }
    return session.user;
  },

  async issue(userId: string) {
    const refreshToken = newRefreshToken();
    const session = await prisma.refreshSession.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + refreshLifetimeMs),
      },
    });
    return { refreshToken, sessionId: session.id };
  },

  async rotate(token: string) {
    const now = new Date();
    const oldHash = hashToken(token);
    const refreshToken = newRefreshToken();
    const session = await prisma.$transaction(async (tx) => {
      const existing = await tx.refreshSession.findUnique({
        where: { tokenHash: oldHash },
        include: { user: true },
      });
      if (!existing || existing.revokedAt || existing.expiresAt <= now || existing.user.status !== "active") {
        throw new ApiError(401, "SESSION_EXPIRED", "Tu sesión terminó. Inicia sesión nuevamente.");
      }
      const claimed = await tx.refreshSession.updateMany({
        where: { id: existing.id, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now },
      });
      if (claimed.count !== 1) {
        throw new ApiError(401, "SESSION_EXPIRED", "Tu sesión terminó. Inicia sesión nuevamente.");
      }
      const replacement = await tx.refreshSession.create({
        data: {
          userId: existing.userId,
          tokenHash: hashToken(refreshToken),
          expiresAt: new Date(now.getTime() + refreshLifetimeMs),
        },
      });
      return { user: existing.user, sessionId: replacement.id };
    });
    return { ...session, refreshToken };
  },

  async revoke(token: string | undefined) {
    if (!token) return;
    await prisma.refreshSession.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async revokeUser(userId: string) {
    await prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};
