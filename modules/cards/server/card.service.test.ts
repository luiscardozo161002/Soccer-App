import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findPlayer: vi.fn(),
  findMatch: vi.fn(),
  findCard: vi.fn(),
  findReason: vi.fn(),
  createCard: vi.fn(),
  deleteCard: vi.fn(),
}));

vi.mock("@/modules/players/server/player.repository", () => ({
  playerRepository: { findById: mocks.findPlayer },
}));
vi.mock("@/modules/matches/server/match.repository", () => ({
  matchRepository: { findById: mocks.findMatch },
}));
vi.mock("./card-reason-config.repository", () => ({
  cardReasonConfigRepository: { findActiveByTypeAndReason: mocks.findReason },
}));
vi.mock("./card.repository", () => ({
  cardRepository: { findById: mocks.findCard, create: mocks.createCard, delete: mocks.deleteCard },
}));

import { cardService } from "./card.service";

const playerId = "00000000-0000-4000-8000-000000000001";
const matchId = "00000000-0000-4000-8000-000000000002";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findPlayer.mockResolvedValue({ id: playerId, teamId: "home-1" });
  mocks.findMatch.mockResolvedValue({ id: matchId, homeTeamId: "home-1", awayTeamId: "away-1", resultLocked: false, matchday: 4 });
  mocks.findReason.mockResolvedValue({ amount: 100 });
});

describe("card service", () => {
  it("passes suspension length and matchday to the atomic write", async () => {
    await cardService.create({ playerId, matchId, type: "red", detail: "Roja", matchesSuspended: 3 });

    expect(mocks.createCard).toHaveBeenCalledWith({
      playerId, matchId, type: "red", detail: "Roja", matchesSuspended: 3, amount: 100, matchday: 4,
    });
  });

  it("cannot add cards to a confirmed match", async () => {
    mocks.findMatch.mockResolvedValue({ id: matchId, homeTeamId: "home-1", awayTeamId: "away-1", resultLocked: true });

    await expect(cardService.create({ playerId, matchId, type: "yellow", detail: "Amarilla" })).rejects.toMatchObject({
      status: 409,
      code: "MATCH_RESULT_LOCKED",
    });
    expect(mocks.createCard).not.toHaveBeenCalled();
  });

  it("cannot remove cards from a confirmed match", async () => {
    mocks.findCard.mockResolvedValue({ id: "card-1", match: { resultLocked: true } });

    await expect(cardService.remove("card-1")).rejects.toMatchObject({ status: 409, code: "MATCH_RESULT_LOCKED" });
    expect(mocks.deleteCard).not.toHaveBeenCalled();
  });
});
