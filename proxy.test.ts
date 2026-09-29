import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findActiveUser: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({
  getSession: mocks.getSession,
  REFRESH_COOKIE_NAME: "session_refresh",
}));
vi.mock("@/modules/auth/server/refresh-session.repository", () => ({
  refreshSessionRepository: { findActiveUser: mocks.findActiveUser },
}));
vi.mock("@/lib/security/rate-limit", () => ({ checkRateLimit: vi.fn() }));

import { proxy } from "./proxy";

function request(path: string, options?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost${path}`, options);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue({ sub: "user-1", role: "admin" });
});

describe("admin page authorization", () => {
  it.each(["/admin", "/admin/settings", "/admin/players", "/admin/history/season-1"])(
    "redirects a referee away from %s",
    async (path) => {
      mocks.getSession.mockResolvedValue({ sub: "ref-1", role: "arbitro" });
      const response = await proxy(request(path));
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost/admin/my-matches");
    }
  );

  it("allows a referee to open their matches", async () => {
    mocks.getSession.mockResolvedValue({ sub: "ref-1", role: "arbitro" });
    const response = await proxy(request("/admin/my-matches"));
    expect(response.status).toBe(200);
  });

  it("allows an administrator to open settings", async () => {
    const response = await proxy(request("/admin/settings"));
    expect(response.status).toBe(200);
  });

  it("rejects an unknown role", async () => {
    mocks.getSession.mockResolvedValue({ sub: "user-1", role: "unknown" });
    const response = await proxy(request("/admin/settings"));
    expect(response.status).toBe(403);
  });

  it("uses a valid refresh session to enforce the role", async () => {
    mocks.getSession.mockResolvedValue(null);
    mocks.findActiveUser.mockResolvedValue({ role: "arbitro" });
    const response = await proxy(request("/admin/settings", {
      headers: { cookie: "session_refresh=valid-token" },
    }));
    expect(response.headers.get("location")).toBe("http://localhost/admin/my-matches");
    expect(mocks.findActiveUser).toHaveBeenCalledWith("valid-token");
  });

  it("preserves administrator access with a valid refresh session", async () => {
    mocks.getSession.mockResolvedValue(null);
    mocks.findActiveUser.mockResolvedValue({ role: "admin" });
    const response = await proxy(request("/admin/settings", {
      headers: { cookie: "session_refresh=valid-token" },
    }));
    expect(response.status).toBe(200);
  });

  it("sends a revoked refresh session to login", async () => {
    mocks.getSession.mockResolvedValue(null);
    mocks.findActiveUser.mockResolvedValue(null);
    const response = await proxy(request("/admin/settings", {
      headers: { cookie: "session_refresh=revoked-token" },
    }));
    expect(response.headers.get("location")).toBe("http://localhost/login?next=%2Fadmin%2Fsettings");
  });
});

describe("settings API authorization", () => {
  it("allows a referee to create, edit and delete match cards, but not change other data", async () => {
    mocks.getSession.mockResolvedValue({ sub: "ref-1", role: "arbitro" });
    expect((await proxy(request("/api/v1/cards", { method: "POST" }))).status).toBe(200);
    expect((await proxy(request("/api/v1/cards/card-1", { method: "DELETE" }))).status).toBe(200);
    expect((await proxy(request("/api/v1/cards/card-1", { method: "PATCH" }))).status).toBe(200);
    expect((await proxy(request("/api/v1/cards/reasons", { method: "POST" }))).status).toBe(403);
    expect((await proxy(request("/api/v1/cards/card-1/pay", { method: "POST" }))).status).toBe(403);
  });

  it("rejects a referee's write", async () => {
    mocks.getSession.mockResolvedValue({ sub: "ref-1", role: "arbitro" });
    const response = await proxy(request("/api/v1/settings", { method: "PATCH" }));
    expect(response.status).toBe(403);
  });

  it("keeps public branding readable", async () => {
    mocks.getSession.mockResolvedValue(null);
    const response = await proxy(request("/api/v1/settings"));
    expect(response.status).toBe(200);
  });

  it("rejects writes from an unknown role", async () => {
    mocks.getSession.mockResolvedValue({ sub: "user-1", role: "unknown" });
    const response = await proxy(request("/api/v1/settings", { method: "PATCH" }));
    expect(response.status).toBe(403);
  });
});
