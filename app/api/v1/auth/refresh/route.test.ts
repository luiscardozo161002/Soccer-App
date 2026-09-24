import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ rotate: vi.fn() }));
vi.mock("@/modules/auth/server/refresh-session.service", () => ({
  refreshSessionService: { rotate: mocks.rotate },
}));

import { POST } from "./route";

const context = { params: Promise.resolve({}) };

beforeEach(() => vi.clearAllMocks());

describe("refresh endpoint", () => {
  it("rejects requests without a refresh cookie", async () => {
    const response = await POST(new NextRequest("http://localhost/api/v1/auth/refresh", { method: "POST" }), context);
    expect(response.status).toBe(401);
    expect(mocks.rotate).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin request", async () => {
    const response = await POST(new NextRequest("http://localhost/api/v1/auth/refresh", {
      method: "POST",
      headers: { origin: "https://other.example", cookie: "session_refresh=old" },
    }), context);
    expect(response.status).toBe(403);
    expect(mocks.rotate).not.toHaveBeenCalled();
  });

  it("rotates the cookie and returns a new access session", async () => {
    mocks.rotate.mockResolvedValue({ accessToken: "new-access", refreshToken: "new-refresh" });
    const response = await POST(new NextRequest("http://localhost/api/v1/auth/refresh", {
      method: "POST",
      headers: { origin: "http://localhost", cookie: "session_refresh=old" },
    }), context);

    expect(response.status).toBe(200);
    expect(response.cookies.get("session")?.value).toBe("new-access");
    expect(response.cookies.get("session_refresh")?.value).toBe("new-refresh");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.rotate).toHaveBeenCalledWith("old");
  });
});
