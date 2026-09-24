import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const DEFAULTS = {
  name: "Liga de Futbol",
  slogan: null,
  logoType: null,
  logoUpdatedAt: null,
  primaryColor: "#0d9488",
  backgroundColor: "#eef3f1",
  locale: "es-MX",
} as const;

export interface SettingsWriteData {
  name?: string;
  slogan?: string | null;
  primaryColor?: string;
  backgroundColor?: string;
  locale?: "es-MX" | "en";
  logo?: Uint8Array<ArrayBuffer> | null;
  logoType?: string | null;
  logoUpdatedAt?: Date | null;
}

async function getSettings() {
  const settings = await prisma.siteSettings.findFirst({ omit: { logo: true } });
  return settings ?? { id: "", ...DEFAULTS };
}

export const settingsRepository = {
  get: getSettings,
  getLogo() {
    return prisma.siteSettings.findFirst({ select: { logo: true, logoType: true } });
  },
  async update(data: SettingsWriteData) {
    const existing = await prisma.siteSettings.findFirst({ select: { id: true } });
    const persistenceData: Omit<Prisma.SiteSettingsUncheckedCreateInput, "id"> = data;
    if (existing) {
      await prisma.siteSettings.update({ where: { id: existing.id }, data: persistenceData });
    } else {
      await prisma.siteSettings.create({ data: persistenceData });
    }
    return getSettings();
  },
};
