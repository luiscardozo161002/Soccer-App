import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), list: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("@/modules/users/server/user.service", () => ({ userService: { list: mocks.list, create: vi.fn() } }));

import { GET } from "./route";

const context = { params: Promise.resolve({}) };
beforeEach(() => vi.clearAllMocks());

describe("users authorization", () => {
  it("does not reveal users to a referee", async () => {
    mocks.getSession.mockResolvedValue({ sub: "ref", role: "arbitro" });
    const response = await GET(new NextRequest("http://localhost/api/v1/users"), context);
    expect(response.status).toBe(403);
    expect(mocks.list).not.toHaveBeenCalled();
  });
});
