import { describe, expect, it } from "vitest";
import { buildCardQueryString, buildCardReasonQueryString } from "./card.api";

describe("card query builders", () => {
  it("serializes card filters", () => {
    expect(buildCardQueryString({ page: 2, pageSize: 25, matchId: "match-1", playerId: "player-1" })).toBe(
      "page=2&pageSize=25&matchId=match-1&playerId=player-1"
    );
  });

  it("preserves false as an active filter", () => {
    expect(buildCardReasonQueryString({ cardType: "red", active: false })).toBe(
      "page=1&pageSize=100&cardType=red&active=false"
    );
  });
});
