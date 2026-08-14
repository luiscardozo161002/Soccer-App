import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

export const SETTINGS_ID = "00000000-0000-4000-8000-000000000002";

export const settingsRepository = {
  get() {
    return prisma.siteSettings.findUnique({ where: { id: SETTINGS_ID }, omit: { logo: true } });
  },

  getLogo() {
    return prisma.siteSettings.findUnique({ where: { id: SETTINGS_ID }, select: { logo: true, logoType: true } });
  },

  update(data: Prisma.SiteSettingsUncheckedUpdateInput) {
    return prisma.siteSettings.update({ where: { id: SETTINGS_ID }, data, omit: { logo: true } });
  },
};
