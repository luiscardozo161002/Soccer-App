import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findCard: vi.fn(),
  findSanction: vi.fn(),
  findByCardId: vi.fn(),
  createSanction: vi.fn(),
  updateSanction: vi.fn(),
}));

vi.mock("@/modules/cards/server/card.repository", () => ({
  cardRepository: { findById: mocks.findCard },
}));
vi.mock("./sanction.repository", () => ({
  sanctionRepository: {
    findById: mocks.findSanction,
    findByCardId: mocks.findByCardId,
    create: mocks.createSanction,
    update: mocks.updateSanction,
  },
}));

import { sanctionService } from "./sanction.service";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findCard.mockResolvedValue({ id: "card-1", type: "red" });
  mocks.findByCardId.mockResolvedValue(null);
  mocks.findSanction.mockResolvedValue({
    id: "sanction-1",
    cardId: "card-1",
    fulfilled: false,
    matchesSuspended: 2,
    _count: { appliedMatches: 1 },
  });
});

describe("sanction service", () => {
  it("rejects a second sanction for the same red card", async () => {
    mocks.findByCardId.mockResolvedValue({ id: "sanction-1" });

    await expect(sanctionService.createForCard("card-1", {
      matchdayStart: 2,
      matchdayEnd: 3,
      matchesSuspended: 2,
    })).rejects.toMatchObject({ status: 409, code: "CARD_ALREADY_SANCTIONED" });
    expect(mocks.createSanction).not.toHaveBeenCalled();
  });

  it("rejects reopening a fully served suspension", async () => {
    mocks.findSanction.mockResolvedValue({
      id: "sanction-1",
      fulfilled: true,
      matchesSuspended: 2,
      _count: { appliedMatches: 2 },
    });

    await expect(sanctionService.update("sanction-1", { fulfilled: false, waivedByPayment: false })).rejects.toMatchObject({
      status: 409,
      code: "SANCTION_ALREADY_SERVED",
    });
    expect(mocks.updateSanction).not.toHaveBeenCalled();
  });

  it("pays an active sanction through the synchronized repository", async () => {
    await sanctionService.payFine("sanction-1");

    expect(mocks.updateSanction).toHaveBeenCalledWith("sanction-1", {
      fulfilled: true,
      waivedByPayment: true,
    });
  });
});
