import { randomBytes } from "crypto";
import { ApiError } from "@/lib/errors";
import { userRepository } from "@/lib/repositories/user.repository";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionToken } from "@/lib/auth/session";
import { emailDeliveryEnabled, sendPasswordResetEmail } from "@/lib/email/resend";

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

  // When email delivery is configured, the reset link is sent to the
  // account's own address and this returns null — the token never appears
  // in the API response, since handing it back to whoever submitted the
  // identifier would be an account-takeover vector. Without RESEND_API_KEY
  // configured (e.g. local dev), it falls back to returning the raw token
  // so the flow stays testable.
  async requestPasswordReset(identifier: string) {
    const user = await userRepository.findByUsernameOrEmail(identifier);
    if (!user) return null;
    const token = randomBytes(32).toString("hex");
    await userRepository.setResetToken(user.id, token, new Date(Date.now() + RESET_TOKEN_TTL_MS));

    if (emailDeliveryEnabled) {
      const appUrl = process.env.APP_URL;
      if (!appUrl) throw new Error("APP_URL is not set");
      await sendPasswordResetEmail(user.email, `${appUrl}/reset-password?token=${token}`);
      return null;
    }
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
