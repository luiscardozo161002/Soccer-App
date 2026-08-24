import { ApiError } from "@/lib/errors";
import type { SessionPayload } from "@/lib/auth/session";

// A referee session may only touch a match it's assigned to; admins (and
// anonymous public visitors, who never carry role "arbitro") pass through
// unchanged — this only ever narrows access, never widens it.
export function assertMatchAccess(session: SessionPayload | null, match: { refereeId: string | null }) {
  if (session?.role === "arbitro" && match.refereeId !== session.sub) {
    throw new ApiError(403, "FORBIDDEN_MATCH", "No tienes acceso a este partido");
  }
}

export function assertAdmin(session: SessionPayload | null) {
  if (session?.role !== "admin") {
    throw new ApiError(403, "FORBIDDEN", "No tienes permiso para esta acción");
  }
}
