import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMatch: vi.fn(),
  updateMatch: vi.fn(),
  findTeam: vi.fn(),
  countCards: vi.fn(),
}));

vi.mock("./match.repository", () => ({
  matchRepository: { findById: mocks.findMatch, update: mocks.updateMatch },
}));
vi.mock("@/modules/teams/server/team.repository", () => ({
  teamRepository: { findById: mocks.findTeam },
}));
vi.mock("@/modules/cards/server/card.repository", () => ({
  cardRepository: { count: mocks.countCards },
}));
vi.mock("@/modules/fields/server/field.repository", () => ({
  fieldRepository: { findById: vi.fn() },
}));
vi.mock("@/modules/seasons/server/season.service", () => ({
  seasonService: { getActive: vi.fn() },
}));

import { matchService } from "./match.service";

const homeTeamId = "00000000-0000-4000-8000-000000000001";
const awayTeamId = "00000000-0000-4000-8000-000000000002";
const replacementTeamId = "00000000-0000-4000-8000-000000000003";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findMatch.mockResolvedValue({
    id: "match-1",
    homeTeamId,
    awayTeamId,
    status: "scheduled",
    resultLocked: false,
    fieldId: "field-1",
    matchday: 1,
    date: new Date("2099-01-01"),
    time: "10:00",
    statusReason: null,
  });
  mocks.findTeam.mockImplementation(async (id) => ({ id, category: "primera_division" }));
  mocks.countCards.mockResolvedValue(0);
  mocks.updateMatch.mockImplementation(async (_id, dto) => dto);
});

describe("editing match participants", () => {
  it("allows a new home team while the match is scheduled", async () => {
    await matchService.update("match-1", { homeTeamId: replacementTeamId });

    expect(mocks.findTeam).toHaveBeenCalledWith(replacementTeamId);
    expect(mocks.findTeam).toHaveBeenCalledWith(awayTeamId);
    expect(mocks.countCards).toHaveBeenCalledWith({ matchId: "match-1" });
    expect(mocks.updateMatch).toHaveBeenCalledWith("match-1", { homeTeamId: replacementTeamId });
  });

  it("rejects participant changes after scheduling", async () => {
    mocks.findMatch.mockResolvedValueOnce({
      homeTeamId,
      awayTeamId,
      status: "postponed",
      resultLocked: false,
      fieldId: "field-1",
      matchday: 1,
      date: new Date("2099-01-01"),
      time: "10:00",
    });

    await expect(matchService.update("match-1", { homeTeamId: replacementTeamId })).rejects.toMatchObject({
      status: 409,
      code: "MATCH_TEAMS_LOCKED",
    });
    expect(mocks.updateMatch).not.toHaveBeenCalled();
  });

  it("rejects the same team on both sides", async () => {
    await expect(matchService.update("match-1", { homeTeamId: awayTeamId })).rejects.toMatchObject({
      status: 422,
      code: "MATCH_TEAMS_EQUAL",
    });
  });

  it("rejects teams from different categories", async () => {
    mocks.findTeam.mockImplementation(async (id) => ({
      id,
      category: id === replacementTeamId ? "segunda_division" : "primera_division",
    }));

    await expect(matchService.update("match-1", { homeTeamId: replacementTeamId })).rejects.toMatchObject({
      status: 409,
      code: "CATEGORY_MISMATCH",
    });
  });

  it("keeps cards attached to their original participants", async () => {
    mocks.countCards.mockResolvedValue(1);

    await expect(matchService.update("match-1", { homeTeamId: replacementTeamId })).rejects.toMatchObject({
      status: 409,
      code: "MATCH_HAS_CARDS",
    });
    expect(mocks.updateMatch).not.toHaveBeenCalled();
  });
});
