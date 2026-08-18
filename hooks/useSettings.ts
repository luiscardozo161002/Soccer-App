"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch } from "@/lib/http/endpoints";
import type { ItemResponse } from "@/lib/http/types";

export interface SiteSettings {
  id: string;
  name: string;
  slogan: string | null;
  logoType: string | null;
  logoUpdatedAt: string | null;
  primaryColor: string;
  backgroundColor: string;
}

export interface UpdateSettingsInput {
  name?: string;
  slogan?: string;
  primaryColor?: string;
  backgroundColor?: string;
  logo?: string;
}

// See playerPhotoUrl (usePlayers.ts) for why the `v` cache-busting param is needed.
export function siteLogoUrl(settings?: Pick<SiteSettings, "logoType" | "logoUpdatedAt"> | null) {
  if (!settings?.logoType) return null;
  const v = settings.logoUpdatedAt ? new Date(settings.logoUpdatedAt).getTime() : 0;
  return `/api/v1/settings/logo?v=${v}`;
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => get<ItemResponse<SiteSettings>>("/api/v1/settings"),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSettingsInput) =>
      patch<ItemResponse<SiteSettings>, UpdateSettingsInput>("/api/v1/settings", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
