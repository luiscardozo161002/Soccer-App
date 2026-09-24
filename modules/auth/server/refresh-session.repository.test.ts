import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { refreshSession: { findUnique: mocks.findUnique } },
}));

import { refreshSessionRepository } from "./refresh-session.repository";

beforeEach(() => vi.clearAllMocks());

describe("refresh session role lookup", () => {
  const user = { id: "user-1", username: "ref", role: "arbitro", status: "active" };

  it("returns the user for a valid token without rotating it", async () => {
    mocks.findUnique.mockResolvedValue({ user, revokedAt: null, expiresAt: new Date(Date.now() + 60_000) });
    expect(await refreshSessionRepository.findActiveUser("refresh-token")).toEqual(user);
    expect(mocks.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { tokenHash: createHash("sha256").update("refresh-token").digest("hex") },
    }));
  });

  it.each([
    { revokedAt: new Date(), expiresAt: new Date(Date.now() + 60_000), user },
    { revokedAt: null, expiresAt: new Date(Date.now() - 60_000), user },
    { revokedAt: null, expiresAt: new Date(Date.now() + 60_000), user: { ...user, status: "inactive" } },
    null,
  ])("rejects an invalid refresh session", async (session) => {
    mocks.findUnique.mockResolvedValue(session);
    expect(await refreshSessionRepository.findActiveUser("refresh-token")).toBeNull();
  });
});
