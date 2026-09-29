import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findPlayer: vi.fn(),
  findMatch: vi.fn(),
  findCard: vi.fn(),
  findReason: vi.fn(),
  createCard: vi.fn(),
  deleteCard: vi.fn(),
  updateDetails: vi.fn(),
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
  cardRepository: { findById: mocks.findCard, create: mocks.createCard, delete: mocks.deleteCard, updateDetails: mocks.updateDetails },
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

  it("allows adding cards after the score is confirmed", async () => {
    mocks.findMatch.mockResolvedValue({ id: matchId, homeTeamId: "home-1", awayTeamId: "away-1", resultLocked: true });

    await cardService.create({ playerId, matchId, type: "yellow", detail: "Amarilla" });
    expect(mocks.createCard).toHaveBeenCalledOnce();
  });

  it("allows removing cards after the score is confirmed", async () => {
    mocks.findCard.mockResolvedValue({ id: "card-1", match: { resultLocked: true } });

    await cardService.remove("card-1");
    expect(mocks.deleteCard).toHaveBeenCalledWith("card-1");
  });

  it("recalculates a corrected card using its configured fine and matchday", async () => {
    mocks.findCard.mockResolvedValue({
      id: "card-1",
      match: { matchday: 4, homeTeam: { id: "home-1" }, awayTeam: { id: "away-1" } },
    });
    const details = { playerId, type: "red" as const, detail: "Roja", matchesSuspended: 2 };
    await cardService.updateDetails("card-1", details);
    expect(mocks.updateDetails).toHaveBeenCalledWith("card-1", { ...details, amount: 100, matchday: 4 });
  });

  it("rejects changing a card to a player outside the match", async () => {
    mocks.findCard.mockResolvedValue({
      id: "card-1",
      match: { matchday: 4, homeTeam: { id: "home-1" }, awayTeam: { id: "away-1" } },
    });
    mocks.findPlayer.mockResolvedValue({ id: playerId, teamId: "other-1" });
    await expect(cardService.updateDetails("card-1", { playerId, type: "yellow", detail: "Falta" }))
      .rejects.toMatchObject({ code: "PLAYER_NOT_IN_MATCH" });
    expect(mocks.updateDetails).not.toHaveBeenCalled();
  });
});
