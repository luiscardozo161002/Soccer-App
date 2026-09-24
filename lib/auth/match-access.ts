import { ApiError } from "@/lib/errors";
import type { SessionPayload } from "@/lib/auth/session";

export function assertMatchAccess(session: SessionPayload | null, match: { refereeId: string | null }) {
  if (session?.role === "arbitro" && match.refereeId !== session.sub) {
    throw new ApiError(403, "FORBIDDEN_MATCH", "No tienes acceso a este partido");
  }
}

export function assertEvidenceAccess(
  session: SessionPayload | null,
  match: { refereeId: string | null }
): asserts session is SessionPayload {
  if (!session) {
    throw new ApiError(401, "UNAUTHORIZED", "Inicia sesión para continuar");
  }
  if (session.role !== "admin" && (session.role !== "arbitro" || match.refereeId !== session.sub)) {
    throw new ApiError(403, "FORBIDDEN_MATCH", "No tienes acceso a este partido");
  }
}

export function assertAdmin(session: SessionPayload | null): asserts session is SessionPayload {
  if (session?.role !== "admin") {
    throw new ApiError(403, "FORBIDDEN", "No tienes permiso para esta acción");
  }
}
