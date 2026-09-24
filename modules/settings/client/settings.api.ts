import { API_ROUTES } from "@/lib/http/api-routes";
import { get, patch } from "@/lib/http/endpoints";
import type { ItemResponse } from "@/lib/http/types";
import type { SiteSettings, UpdateSettingsInput } from "../settings.types";

export function siteLogoUrl(settings?: Pick<SiteSettings, "logoType" | "logoUpdatedAt"> | null) {
  if (!settings?.logoType) return null;
  const version = settings.logoUpdatedAt ? new Date(settings.logoUpdatedAt).getTime() : 0;
  return `${API_ROUTES.settings.logo}?v=${version}`;
}

export const settingsApi = {
  get() {
    return get<ItemResponse<SiteSettings>>(API_ROUTES.settings.get);
  },
  update(input: UpdateSettingsInput) {
    return patch<ItemResponse<SiteSettings>, UpdateSettingsInput>(API_ROUTES.settings.get, input);
  },
};
