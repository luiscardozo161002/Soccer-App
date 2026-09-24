import { describe, expect, it } from "vitest";
import { buildTeamQueryString } from "./team.api";

describe("buildTeamQueryString", () => {
  it("uses stable pagination defaults", () => {
    expect(buildTeamQueryString({})).toBe("page=1&pageSize=100");
  });

  it("serializes the category filter", () => {
    expect(buildTeamQueryString({ page: 2, pageSize: 20, category: "division_ascenso" })).toBe(
      "page=2&pageSize=20&category=division_ascenso"
    );
  });
});
