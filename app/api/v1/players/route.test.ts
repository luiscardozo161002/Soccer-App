import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ApiError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/modules/players/server/player.service", () => ({
  playerService: { list: mocks.list, create: mocks.create },
}));

import { GET, POST } from "./route";

const context = { params: Promise.resolve({}) };
const teamId = "00000000-0000-4000-8000-000000000001";

beforeEach(() => vi.clearAllMocks());

describe("players API contract", () => {
  it("validates numeric folios before calling the service", async () => {
    const request = new NextRequest("http://localhost/api/v1/players", {
      method: "POST",
      body: JSON.stringify({ teamId, name: "Jugador", folioNumber: "TIG-001" }),
      headers: { "x-request-id": "e2e-contract" },
    });

    const response = await POST(request, context);
    expect(response.status).toBe(422);
    expect(response.headers.get("x-request-id")).toBe("e2e-contract");
    expect(await response.json()).toMatchObject({
      error: { code: "VALIDATION_ERROR", details: [{ field: "folioNumber" }] },
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("preserves the service's duplicate-name conflict", async () => {
    mocks.create.mockRejectedValue(new ApiError(409, "PLAYER_NAME_DUPLICATED", "Ya existe ese jugador"));
    const request = new NextRequest("http://localhost/api/v1/players", {
      method: "POST",
      body: JSON.stringify({ teamId, name: "Jugador", folioNumber: "001" }),
    });

    const response = await POST(request, context);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: "PLAYER_NAME_DUPLICATED", message: "Ya existe ese jugador" },
    });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ folioNumber: "001" }));
  });

  it("parses pagination and category for list requests", async () => {
    mocks.list.mockResolvedValue({ items: [], totalItems: 0, totalPages: 0 });
    const request = new NextRequest("http://localhost/api/v1/players?page=2&pageSize=20&category=primera_division");

    const response = await GET(request, context);
    expect(response.status).toBe(200);
    expect(mocks.list).toHaveBeenCalledWith(2, 20, undefined, "primera_division");
    expect(await response.json()).toMatchObject({
      success: true,
      meta: { page: 2, pageSize: 20, totalItems: 0, totalPages: 0 },
    });
  });
});
