import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getMatch: vi.fn(),
  createCard: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("@/modules/matches/server/match.service", () => ({ matchService: { getById: mocks.getMatch } }));
vi.mock("@/modules/cards/server/card.service", () => ({ cardService: { create: mocks.createCard } }));

import { POST } from "./route";

const matchId = "00000000-0000-4000-8000-000000000001";
const playerId = "00000000-0000-4000-8000-000000000002";
const dto = { matchId, playerId, type: "yellow", detail: "Falta" };
const request = () => new NextRequest("http://localhost/api/v1/cards", {
  method: "POST",
  body: JSON.stringify(dto),
});
const context = { params: Promise.resolve({}) };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getMatch.mockResolvedValue({ refereeId: "ref-1", resultLocked: true });
  mocks.createCard.mockResolvedValue({ id: "card-1" });
});

describe("match card creation access", () => {
  it("allows the assigned referee after the score is confirmed", async () => {
    mocks.getSession.mockResolvedValue({ sub: "ref-1", role: "arbitro" });
    const response = await POST(request(), context);
    expect(response.status).toBe(201);
    expect(mocks.createCard).toHaveBeenCalledWith(dto);
  });

  it("rejects a referee assigned to another match", async () => {
    mocks.getSession.mockResolvedValue({ sub: "ref-2", role: "arbitro" });
    const response = await POST(request(), context);
    expect(response.status).toBe(403);
    expect(mocks.createCard).not.toHaveBeenCalled();
  });

  it("allows an administrator", async () => {
    mocks.getSession.mockResolvedValue({ sub: "admin-1", role: "admin" });
    expect((await POST(request(), context)).status).toBe(201);
  });
});
