import { describe, expect, it } from "vitest";
import { adminPhotoUrl, buildUserQueryString } from "./user.api";

describe("user client helpers", () => {
  it("serializes pagination and role filters", () => {
    expect(buildUserQueryString({ page: 2, pageSize: 25, role: "arbitro" })).toBe(
      "page=2&pageSize=25&role=arbitro"
    );
  });

  it("only creates a photo URL when a photo exists", () => {
    expect(adminPhotoUrl({ id: "user-1", photoType: null, photoUpdatedAt: null })).toBeNull();
    expect(
      adminPhotoUrl({ id: "user-1", photoType: "image/webp", photoUpdatedAt: "2026-01-01T00:00:00.000Z" })
    ).toContain("/api/v1/users/user-1/photo?v=");
  });
});
