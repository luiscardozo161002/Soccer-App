import { describe, expect, it } from "vitest";
import { buildMatchQueryString } from "./match.api";

describe("buildMatchQueryString", () => {
  it("uses stable pagination defaults", () => {
    expect(buildMatchQueryString({})).toBe("page=1&pageSize=100");
  });

  it("serializes the supported filters", () => {
    const query = buildMatchQueryString({
      page: 2,
      pageSize: 20,
      matchday: 4,
      teamId: "team-id",
      status: "scheduled",
      category: "primera_division",
      refereeId: "referee-id",
    });

    expect(Object.fromEntries(new URLSearchParams(query))).toEqual({
      page: "2",
      pageSize: "20",
      matchday: "4",
      teamId: "team-id",
      status: "scheduled",
      category: "primera_division",
      refereeId: "referee-id",
    });
  });
});
