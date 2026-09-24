import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, loginSchema } from "./auth.schema";

describe("auth schemas", () => {
  it("normalizes login identifiers", () => {
    expect(loginSchema.parse({ username: "  admin@example.com  ", password: "secret" }).username).toBe(
      "admin@example.com"
    );
  });

  it("rejects an empty password reset identifier", () => {
    expect(forgotPasswordSchema.safeParse({ identifier: "   " }).success).toBe(false);
  });
});
