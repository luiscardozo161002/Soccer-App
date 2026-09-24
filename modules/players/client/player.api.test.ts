import { describe, expect, it } from "vitest";
import { buildPlayerQueryString } from "./player.api";

describe("buildPlayerQueryString", () => {
  it("uses stable pagination defaults", () => {
    expect(buildPlayerQueryString({})).toBe("page=1&pageSize=100");
  });

  it("serializes team and category filters", () => {
    expect(
      buildPlayerQueryString({
        page: 3,
        pageSize: 50,
        teamId: "team-id",
        category: "segunda_division",
      })
    ).toBe("page=3&pageSize=50&teamId=team-id&category=segunda_division");
  });
});
