import { API_ROUTES } from "@/lib/http/api-routes";
import { get, post } from "@/lib/http/endpoints";
import type { ItemResponse } from "@/lib/http/types";
import type { AuthUser, ForgotPasswordInput, LoginInput, ResetPasswordInput } from "../auth.types";

export const authApi = {
  me() {
    return get<ItemResponse<AuthUser>>(API_ROUTES.auth.me);
  },
  login(input: LoginInput) {
    return post<ItemResponse<AuthUser>, LoginInput>(API_ROUTES.auth.login, input);
  },
  logout() {
    return post<ItemResponse<null>, Record<string, never>>(API_ROUTES.auth.logout, {});
  },
  forgotPassword(input: ForgotPasswordInput) {
    return post<ItemResponse<{ resetUrl: string | null }>, ForgotPasswordInput>(API_ROUTES.auth.forgotPassword, input);
  },
  resetPassword(input: ResetPasswordInput) {
    return post<ItemResponse<null>, ResetPasswordInput>(API_ROUTES.auth.resetPassword, input);
  },
};
