import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/errors";
import { assertMatchDateNotBefore, toMatchDateTime } from "./match.rules";

describe("match rules", () => {
  it("rejects dates before today", () => {
    expect(() =>
      assertMatchDateNotBefore(new Date("2026-09-20T00:00:00.000Z"), new Date("2026-09-21T12:00:00"))
    ).toThrowError(
      expect.objectContaining<Partial<ApiError>>({
        status: 422,
        code: "MATCH_DATE_IN_PAST",
      })
    );
  });

  it("accepts today and future dates", () => {
    const today = new Date("2026-09-21T12:00:00");
    expect(() => assertMatchDateNotBefore(new Date("2026-09-21T00:00:00.000Z"), today)).not.toThrow();
    expect(() => assertMatchDateNotBefore(new Date("2026-09-22T00:00:00.000Z"), today)).not.toThrow();
  });

  it("combines the match day and time", () => {
    expect(toMatchDateTime(new Date("2026-09-21T00:00:00.000Z"), "18:30")).toEqual(
      new Date("2026-09-21T18:30:00")
    );
  });
});
