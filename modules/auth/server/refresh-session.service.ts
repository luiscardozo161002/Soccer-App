import { createSessionToken } from "@/lib/auth/session";
import { refreshSessionRepository } from "./refresh-session.repository";

export const refreshSessionService = {
  issue: refreshSessionRepository.issue,

  async rotate(token: string) {
    const { user, sessionId, refreshToken } = await refreshSessionRepository.rotate(token);
    const accessToken = await createSessionToken({
      sub: user.id,
      sid: sessionId,
      username: user.username,
      role: user.role,
    });
    return { accessToken, refreshToken };
  },

  revoke: refreshSessionRepository.revoke,
  revokeUser: refreshSessionRepository.revokeUser,
};
