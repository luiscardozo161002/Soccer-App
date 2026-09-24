import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), get: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("@/modules/settings/server/settings.service", () => ({
  settingsService: { get: mocks.get, update: mocks.update },
}));

import { GET, PATCH } from "./route";

const context = { params: Promise.resolve({}) };
beforeEach(() => vi.clearAllMocks());

describe("settings authorization", () => {
  it("keeps public branding readable", async () => {
    mocks.get.mockResolvedValue({ name: "Liga" });
    const response = await GET(new NextRequest("http://localhost/api/v1/settings"), context);
    expect(response.status).toBe(200);
  });

  it("denies a referee before parsing or updating settings", async () => {
    mocks.getSession.mockResolvedValue({ sub: "ref-1", role: "arbitro" });
    const response = await PATCH(new NextRequest("http://localhost/api/v1/settings", { method: "PATCH" }), context);
    expect(response.status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("denies an unauthenticated update", async () => {
    mocks.getSession.mockResolvedValue(null);
    const response = await PATCH(new NextRequest("http://localhost/api/v1/settings", { method: "PATCH" }), context);
    expect(response.status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("allows an administrator to update settings", async () => {
    mocks.getSession.mockResolvedValue({ sub: "admin-1", role: "admin" });
    mocks.update.mockResolvedValue({ name: "Liga nueva" });
    const response = await PATCH(new NextRequest("http://localhost/api/v1/settings", {
      method: "PATCH",
      body: JSON.stringify({ name: "Liga nueva" }),
    }), context);
    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith({ name: "Liga nueva" });
  });
});
