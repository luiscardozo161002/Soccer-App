import { describe, expect, it } from "vitest";
import { buildFieldQueryString, googleMapsUrl } from "./field.api";

describe("field client helpers", () => {
  it("uses stable pagination defaults", () => {
    expect(buildFieldQueryString({})).toBe("page=1&pageSize=100");
  });

  it("keeps URLs and converts addresses to Google Maps searches", () => {
    expect(googleMapsUrl(" https://maps.example/field ")).toBe("https://maps.example/field");
    expect(googleMapsUrl("Cancha Norte #2")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Cancha%20Norte%20%232"
    );
  });
});
