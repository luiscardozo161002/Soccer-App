import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { refreshSession: { findUnique: mocks.findUnique } },
}));

import { createSessionToken, getSession, verifySessionToken } from "./session";

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-at-least-32-characters-long";
  vi.clearAllMocks();
});

describe("session validation", () => {
  it("accepts only a signed token with a session id", async () => {
    const token = await createSessionToken({ sub: "u1", sid: "s1", username: "old", role: "admin" });
    expect(await verifySessionToken(token)).toMatchObject({ sub: "u1", sid: "s1" });
    expect(await verifySessionToken(token + "tampered")).toBeNull();
  });

  it("reads fresh role and denies revoked sessions", async () => {
    const token = await createSessionToken({ sub: "u1", sid: "s1", username: "old", role: "admin" });
    const request = new NextRequest("http://localhost/admin", { headers: { cookie: `session=${token}` } });
    mocks.findUnique.mockResolvedValue({
      userId: "u1",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { status: "active", username: "current", role: "arbitro" },
    });
    expect(await getSession(request)).toMatchObject({ username: "current", role: "arbitro" });

    mocks.findUnique.mockResolvedValue({
      userId: "u1",
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      user: { status: "active", username: "current", role: "arbitro" },
    });
    expect(await getSession(request)).toBeNull();
  });
});
