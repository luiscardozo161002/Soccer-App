import { describe, expect, it } from "vitest";
import { assertEvidenceAccess } from "./match-access";
import type { SessionPayload } from "./session";

const admin: SessionPayload = { sub: "admin", sid: "s1", username: "admin", role: "admin" };
const referee: SessionPayload = { sub: "ref", sid: "s2", username: "ref", role: "arbitro" };

describe("evidence authorization", () => {
  it("requires a session", () => {
    expect(() => assertEvidenceAccess(null, { refereeId: "ref" })).toThrowError(
      expect.objectContaining({ status: 401 })
    );
  });

  it("limits referees to their assigned match", () => {
    expect(() => assertEvidenceAccess(referee, { refereeId: "other" })).toThrowError(
      expect.objectContaining({ status: 403 })
    );
    expect(() => assertEvidenceAccess(referee, { refereeId: "ref" })).not.toThrow();
  });

  it("allows an administrator", () => {
    expect(() => assertEvidenceAccess(admin, { refereeId: null })).not.toThrow();
  });
});
