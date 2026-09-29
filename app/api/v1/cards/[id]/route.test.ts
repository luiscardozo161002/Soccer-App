import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getCard: vi.fn(),
  removeCard: vi.fn(),
  updateCard: vi.fn(),
  updateDetails: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("@/modules/cards/server/card.service", () => ({
  cardService: { getById: mocks.getCard, remove: mocks.removeCard, update: mocks.updateCard, updateDetails: mocks.updateDetails },
}));

import { DELETE, PATCH } from "./route";

const request = new NextRequest("http://localhost/api/v1/cards/card-1", { method: "DELETE" });
const context = { params: Promise.resolve({ id: "card-1" }) };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCard.mockResolvedValue({ id: "card-1", match: { refereeId: "ref-1", resultLocked: true } });
});

describe("match card deletion access", () => {
  it("allows the assigned referee", async () => {
    mocks.getSession.mockResolvedValue({ sub: "ref-1", role: "arbitro" });
    expect((await DELETE(request, context)).status).toBe(204);
    expect(mocks.removeCard).toHaveBeenCalledWith("card-1");
  });

  it("rejects a referee assigned to another match", async () => {
    mocks.getSession.mockResolvedValue({ sub: "ref-2", role: "arbitro" });
    expect((await DELETE(request, context)).status).toBe(403);
    expect(mocks.removeCard).not.toHaveBeenCalled();
  });
});

describe("match card editing access", () => {
  const details = {
    playerId: "00000000-0000-4000-8000-000000000001",
    type: "yellow",
    detail: "Falta",
  };
  const patchRequest = (body: unknown) => new NextRequest("http://localhost/api/v1/cards/card-1", {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  it("allows the assigned referee to correct card details", async () => {
    mocks.getSession.mockResolvedValue({ sub: "ref-1", role: "arbitro" });
    expect((await PATCH(patchRequest(details), context)).status).toBe(200);
    expect(mocks.updateDetails).toHaveBeenCalledWith("card-1", details);
  });

  it("rejects card edits for another referee", async () => {
    mocks.getSession.mockResolvedValue({ sub: "ref-2", role: "arbitro" });
    expect((await PATCH(patchRequest(details), context)).status).toBe(403);
    expect(mocks.updateDetails).not.toHaveBeenCalled();
  });

  it("does not allow a referee to change payment status", async () => {
    mocks.getSession.mockResolvedValue({ sub: "ref-1", role: "arbitro" });
    expect((await PATCH(patchRequest({ paid: false }), context)).status).toBe(403);
    expect(mocks.updateCard).not.toHaveBeenCalled();
  });
});
