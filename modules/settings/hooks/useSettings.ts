"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { settingsApi, siteLogoUrl } from "../client/settings.api";
import type { UpdateSettingsInput } from "../settings.types";

export { siteLogoUrl };
export type { SiteSettings, UpdateSettingsInput } from "../settings.types";

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: settingsApi.get,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSettingsInput) => settingsApi.update(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings.all }),
  });
}
