import type { UpdateSettingsDto } from "./settings.schema";

export interface SiteSettings {
  id: string;
  name: string;
  slogan: string | null;
  logoType: string | null;
  logoUpdatedAt: string | null;
  primaryColor: string;
  backgroundColor: string;
  locale: "es-MX" | "en";
}

export type UpdateSettingsInput = UpdateSettingsDto;
