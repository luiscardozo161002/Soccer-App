import type { Role } from "@/lib/auth/roles";
import type { ForgotPasswordDto, LoginDto, ResetPasswordDto } from "./auth.schema";

export interface AuthUser {
  id: string;
  username: string;
  role: Role;
  photoType: string | null;
  photoUpdatedAt: string | null;
}

export type LoginInput = LoginDto;
export type ForgotPasswordInput = ForgotPasswordDto;
export type ResetPasswordInput = ResetPasswordDto;
