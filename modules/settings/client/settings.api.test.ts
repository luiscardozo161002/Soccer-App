import { describe, expect, it } from "vitest";
import { siteLogoUrl } from "./settings.api";

describe("siteLogoUrl", () => {
  it("returns null when no logo is configured", () => {
    expect(siteLogoUrl(null)).toBeNull();
    expect(siteLogoUrl({ logoType: null, logoUpdatedAt: null })).toBeNull();
  });

  it("adds a stable cache-busting version", () => {
    expect(siteLogoUrl({ logoType: "image/webp", logoUpdatedAt: "2026-01-01T00:00:00.000Z" })).toBe(
      "/api/v1/settings/logo?v=1767225600000"
    );
  });
});
