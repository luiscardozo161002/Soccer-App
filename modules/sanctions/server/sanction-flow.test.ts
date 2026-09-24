import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const tx = vi.hoisted(() => ({
  card: { update: vi.fn() },
  match: { update: vi.fn() },
  sanction: {
    findMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  sanctionMatch: { findUnique: vi.fn(), create: vi.fn(), count: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)) },
}));

import { cardRepository } from "@/modules/cards/server/card.repository";
import { matchRepository } from "@/modules/matches/server/match.repository";
import { sanctionRepository } from "./sanction.repository";
import { sanctionService } from "./sanction.service";

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("sanction flow", () => {
  it("counts a later team match after a skipped matchday", async () => {
    tx.match.update.mockResolvedValue({
      id: "match-2",
      seasonId: "season-1",
      matchday: 8,
      homeTeamId: "home",
      awayTeamId: "away",
      homeTeam: { category: "primera_division" },
    });
    tx.sanction.findMany.mockResolvedValueOnce([
      { id: "sanction-1", matchdayEnd: 7, matchesSuspended: 2 },
    ]).mockResolvedValueOnce([]);
    tx.sanctionMatch.findUnique.mockResolvedValue(null);
    tx.sanctionMatch.count.mockResolvedValue(1);

    await matchRepository.registerResult(
      "match-2",
      { homeGoals: 1, awayGoals: 0 },
      { actorUserId: "admin-1", isCorrection: false }
    );

    const where = tx.sanction.findMany.mock.calls[0][0].where;
    expect(where.matchdayEnd).toBeUndefined();
    expect(where.card.match.seasonId).toBe("season-1");
    expect(tx.sanctionMatch.create).toHaveBeenCalledWith({
      data: { sanctionId: "sanction-1", matchId: "match-2" },
    });
    expect(tx.sanction.update).toHaveBeenCalledWith({
      where: { id: "sanction-1" },
      data: { fulfilled: false, matchdayEnd: 8 },
    });
  });

  it("paying a card lifts its pending sanction in the same transaction", async () => {
    tx.card.update.mockResolvedValue({ id: "card-1", paid: true });
    await cardRepository.pay("card-1");
    expect(tx.sanction.updateMany).toHaveBeenCalledWith({
      where: { cardId: "card-1", fulfilled: false },
      data: { fulfilled: true, waivedByPayment: true },
    });
  });

  it("paying a sanction marks its card paid", async () => {
    tx.sanction.findUniqueOrThrow.mockResolvedValue({
      cardId: "card-1",
      fulfilled: false,
      waivedByPayment: false,
      matchesSuspended: 2,
      _count: { appliedMatches: 0 },
    });
    tx.sanction.update.mockResolvedValue({ id: "sanction-1", fulfilled: true });
    await sanctionRepository.update("sanction-1", { fulfilled: true, waivedByPayment: true });
    expect(tx.card.update).toHaveBeenCalledWith({
      where: { id: "card-1" },
      data: { paid: true },
    });
  });

  it("rejects a second sanction for the same red card", async () => {
    vi.spyOn(cardRepository, "findById").mockResolvedValue({ type: "red" } as never);
    vi.spyOn(sanctionRepository, "findByCardId").mockResolvedValue({ id: "sanction-1" } as never);
    await expect(sanctionService.createForCard("card-1", {
      matchdayStart: 2,
      matchdayEnd: 3,
      matchesSuspended: 2,
    })).rejects.toMatchObject({ status: 409, code: "CARD_ALREADY_SANCTIONED" });
  });
});
