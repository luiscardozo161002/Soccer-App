import { describe, expect, it } from "vitest";
import { activeSanctionsByPlayer, sanctionMatchesRemaining } from "./sanction.rules";
import type { Sanction } from "./sanction.types";

function sanction(overrides: Partial<Sanction> = {}): Sanction {
  return {
    id: "sanction-1",
    cardId: "card-1",
    matchdayStart: 1,
    matchdayEnd: 3,
    matchesSuspended: 2,
    fulfilled: false,
    waivedByPayment: false,
    card: {
      id: "card-1",
      type: "red",
      detail: null,
      amount: null,
      player: {
        id: "player-1",
        name: "Player",
        photoType: null,
        photoUpdatedAt: null,
        team: { id: "team-1", name: "Team", category: "primera_division" },
      },
      match: { id: "match-1", matchday: 1, date: "2026-01-01" },
    },
    _count: { appliedMatches: 1 },
    ...overrides,
  };
}

describe("sanction rules", () => {
  it("never returns a negative remaining count", () => {
    expect(sanctionMatchesRemaining(sanction({ _count: { appliedMatches: 4 } }))).toBe(0);
  });

  it("indexes only active sanctions", () => {
    const active = sanction();
    const fulfilled = sanction({ id: "sanction-2", fulfilled: true });
    expect(activeSanctionsByPlayer([active, fulfilled]).get("player-1")?.map((item) => item.id)).toEqual(["sanction-1"]);
  });

  it("keeps every active sanction for a player", () => {
    const first = sanction();
    const second = sanction({ id: "sanction-2", cardId: "card-2" });
    expect(activeSanctionsByPlayer([first, second]).get("player-1")?.map((item) => item.id)).toEqual(["sanction-1", "sanction-2"]);
  });
});
