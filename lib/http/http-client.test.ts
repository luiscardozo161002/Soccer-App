import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";

const session = vi.hoisted(() => ({
  requestSessionRenewal: vi.fn(),
  redirectToLogin: vi.fn(),
  isLoggingOut: vi.fn(() => false),
}));

vi.mock("@/lib/auth/client-session", () => session);

import { http } from "./http-client";

beforeEach(() => {
  vi.stubGlobal("window", {});
  vi.clearAllMocks();
});

afterEach(() => vi.unstubAllGlobals());

describe("HTTP session renewal", () => {
  it("retries a protected request once after renewal", async () => {
    session.requestSessionRenewal.mockResolvedValue(true);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: "UNAUTHORIZED" } }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { id: "ok" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(http("/api/v1/players", { method: "POST", body: '{"name":"Test"}' }))
      .resolves.toMatchObject({ data: { id: "ok" } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(session.requestSessionRenewal).toHaveBeenCalledOnce();
  });

  it("does not retry when the user declines", async () => {
    session.requestSessionRenewal.mockResolvedValue(false);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "UNAUTHORIZED" } }), { status: 401 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(http("/api/v1/players")).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(session.redirectToLogin).toHaveBeenCalled();
  });

  it("does not renew for permission errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "FORBIDDEN" } }), { status: 403 })
    ));
    await expect(http("/api/v1/users")).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(session.requestSessionRenewal).not.toHaveBeenCalled();
  });

  it("does not renew a 401 that happens while logging out", async () => {
    session.isLoggingOut.mockReturnValue(true);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "UNAUTHORIZED" } }), { status: 401 })
    ));
    await expect(http("/api/v1/auth/me")).rejects.toBeInstanceOf(ApiError);
    expect(session.requestSessionRenewal).not.toHaveBeenCalled();
  });
});
