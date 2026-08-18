"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch } from "@/lib/http/endpoints";
import type { ItemResponse } from "@/lib/http/types";
import { API_ROUTES } from "@/lib/http/api-routes";
import type { UpdateSettingsDto } from "@/lib/validation/settings.schema";

export interface SiteSettings {
  id: string;
  name: string;
  slogan: string | null;
  logoType: string | null;
  logoUpdatedAt: string | null;
  primaryColor: string;
  backgroundColor: string;
}

export type UpdateSettingsInput = UpdateSettingsDto;

// See playerPhotoUrl (usePlayers.ts) for why the `v` cache-busting param is needed.
export function siteLogoUrl(settings?: Pick<SiteSettings, "logoType" | "logoUpdatedAt"> | null) {
  if (!settings?.logoType) return null;
  const v = settings.logoUpdatedAt ? new Date(settings.logoUpdatedAt).getTime() : 0;
  return `${API_ROUTES.settings.logo}?v=${v}`;
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => get<ItemResponse<SiteSettings>>(API_ROUTES.settings.get),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSettingsInput) =>
      patch<ItemResponse<SiteSettings>, UpdateSettingsInput>(API_ROUTES.settings.get, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
