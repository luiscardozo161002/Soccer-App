import { randomBytes } from "crypto";
import { ApiError } from "@/lib/errors";
import { userRepository } from "@/lib/repositories/user.repository";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionToken } from "@/lib/auth/session";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

export const authService = {
  async login(username: string, password: string) {
    const user = await userRepository.findByUsernameOrEmail(username);
    if (!user || user.status !== "active" || !verifyPassword(password, user.passwordHash)) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Usuario o contraseña incorrectos");
    }
    const token = await createSessionToken({ sub: user.id, username: user.username, role: user.role });
    return { token, user: { id: user.id, username: user.username, email: user.email, role: user.role } };
  },

  // Returns the raw token so the caller can hand back a reset link — there's
  // no email provider configured yet (see the forgot-password route for the
  // security note on this temporary arrangement).
  async requestPasswordReset(identifier: string) {
    const user = await userRepository.findByUsernameOrEmail(identifier);
    if (!user) return null;
    const token = randomBytes(32).toString("hex");
    await userRepository.setResetToken(user.id, token, new Date(Date.now() + RESET_TOKEN_TTL_MS));
    return token;
  },

  async resetPassword(token: string, newPassword: string) {
    const user = await userRepository.findByResetToken(token);
    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      throw new ApiError(400, "INVALID_RESET_TOKEN", "El enlace de recuperación es inválido o expiró");
    }
    await userRepository.updatePassword(user.id, hashPassword(newPassword));
  },
};
