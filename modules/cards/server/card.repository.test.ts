import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/app/generated/prisma/client";
import { createCardSchema } from "../card.schema";

const mocks = vi.hoisted(() => {
  const tx = {
    card: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    sanction: { create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
  };
  return { tx, transaction: vi.fn(async (operation) => operation(tx)) };
});

vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));

import { cardRepository } from "./card.repository";

const playerId = "00000000-0000-4000-8000-000000000001";
const matchId = "00000000-0000-4000-8000-000000000002";
const amount = {} as Prisma.Decimal;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.tx.card.create.mockResolvedValue({ id: "card-1" });
  mocks.tx.sanction.create.mockResolvedValue({ id: "sanction-1" });
  mocks.tx.card.update.mockResolvedValue({ id: "card-1", paid: true });
  mocks.tx.sanction.findMany.mockResolvedValue([]);
});

describe("card and sanction creation", () => {
  it("requires a suspension length for red cards only", () => {
    expect(createCardSchema.safeParse({ playerId, matchId, type: "red", detail: "Roja" }).success).toBe(false);
    expect(createCardSchema.safeParse({ playerId, matchId, type: "yellow", detail: "Amarilla", matchesSuspended: 2 }).success).toBe(false);
  });

  it("creates a red card and suspension in one transaction", async () => {
    await cardRepository.create({ playerId, matchId, type: "red", detail: "Roja", matchesSuspended: 3, amount, matchday: 4 });

    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.tx.card.create).toHaveBeenCalledOnce();
    expect(mocks.tx.sanction.create).toHaveBeenCalledWith({
      data: { cardId: "card-1", matchdayStart: 5, matchdayEnd: 7, matchesSuspended: 3 },
    });
  });

  it("does not create a sanction for a yellow card", async () => {
    await cardRepository.create({ playerId, matchId, type: "yellow", detail: "Amarilla", amount, matchday: 4 });

    expect(mocks.tx.sanction.create).not.toHaveBeenCalled();
  });

  it("propagates a failed suspension creation", async () => {
    mocks.tx.sanction.create.mockRejectedValue(new Error("write failed"));

    await expect(cardRepository.create({ playerId, matchId, type: "red", detail: "Roja", matchesSuspended: 1, amount, matchday: 4 })).rejects.toThrow("write failed");
  });

  it("paying a card also waives its active suspension", async () => {
    await cardRepository.pay("card-1");

    expect(mocks.tx.sanction.updateMany).toHaveBeenCalledWith({
      where: { cardId: "card-1", fulfilled: false },
      data: { fulfilled: true, waivedByPayment: true },
    });
  });

  it("reverting payment reopens only unserved suspensions", async () => {
    mocks.tx.sanction.findMany.mockResolvedValue([
      { id: "sanction-1", matchesSuspended: 2, _count: { appliedMatches: 1 } },
      { id: "sanction-2", matchesSuspended: 2, _count: { appliedMatches: 2 } },
    ]);

    await cardRepository.update("card-1", { paid: false });

    expect(mocks.tx.sanction.update).toHaveBeenCalledWith({
      where: { id: "sanction-1" },
      data: { fulfilled: false, waivedByPayment: false },
    });
    expect(mocks.tx.sanction.update).toHaveBeenCalledWith({
      where: { id: "sanction-2" },
      data: { fulfilled: true, waivedByPayment: false },
    });
  });

  it("removes an unapplied suspension with its card", async () => {
    mocks.tx.sanction.findUnique.mockResolvedValue({ id: "sanction-1", _count: { appliedMatches: 0 } });
    mocks.tx.card.delete.mockResolvedValue({ id: "card-1" });

    await cardRepository.delete("card-1");

    expect(mocks.tx.sanction.delete).toHaveBeenCalledWith({ where: { id: "sanction-1" } });
    expect(mocks.tx.card.delete).toHaveBeenCalledWith({ where: { id: "card-1" } });
  });
});
