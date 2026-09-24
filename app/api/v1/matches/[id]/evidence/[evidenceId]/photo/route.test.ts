import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getById: vi.fn(),
  findPhoto: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("@/modules/matches/server/match.service", () => ({ matchService: { getById: mocks.getById } }));
vi.mock("@/modules/matches/server/match-evidence.repository", () => ({
  matchEvidenceRepository: { findPhoto: mocks.findPhoto },
}));

import { GET } from "./route";

const request = new NextRequest("http://localhost/api/v1/matches/m1/evidence/e1/photo");
const context = { params: Promise.resolve({ id: "m1", evidenceId: "e1" }) };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getById.mockResolvedValue({ refereeId: "ref" });
});

describe("evidence photo access", () => {
  it("rejects anonymous viewers before loading the photo", async () => {
    mocks.getSession.mockResolvedValue(null);
    const response = await GET(request, context);
    expect(response.status).toBe(401);
    expect(mocks.findPhoto).not.toHaveBeenCalled();
  });

  it("does not reveal a photo belonging to another match", async () => {
    mocks.getSession.mockResolvedValue({ sub: "admin", role: "admin" });
    mocks.findPhoto.mockResolvedValue({
      matchId: "m2",
      photo: Uint8Array.from([1, 2, 3]),
      photoType: "image/png",
    });
    const response = await GET(request, context);
    expect(response.status).toBe(404);
  });

  it("serves an authorized photo without public caching", async () => {
    mocks.getSession.mockResolvedValue({ sub: "ref", role: "arbitro" });
    mocks.findPhoto.mockResolvedValue({
      matchId: "m1",
      photo: Uint8Array.from([1, 2, 3]),
      photoType: "image/png",
    });
    const response = await GET(request, context);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
});
