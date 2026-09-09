import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

// site_settings is a true singleton (exactly one row, always) but its id is
// just whatever UUID Prisma generated when the row was created — nothing
// else ever needs to reference that specific value, so callers never look
// it up.
//
// No migration inserts this row anymore — the table can legitimately start
// empty. get() falls back to the same column defaults schema.prisma already
// declares, so every caller keeps working with zero setup. The row itself
// only gets persisted the first time someone actually saves a change, via
// the create-if-missing branch in update().
const DEFAULTS = {
  name: "Liga de Futbol",
  slogan: null,
  logoType: null,
  logoUpdatedAt: null,
  primaryColor: "#0d9488",
  backgroundColor: "#eef3f1",
} as const;

export const settingsRepository = {
  async get() {
    const settings = await prisma.siteSettings.findFirst({ omit: { logo: true } });
    return settings ?? { id: "", ...DEFAULTS };
  },

  getLogo() {
    return prisma.siteSettings.findFirst({ select: { logo: true, logoType: true } });
  },

  async update(data: Omit<Prisma.SiteSettingsUncheckedCreateInput, "id">) {
    const existing = await prisma.siteSettings.findFirst({ select: { id: true } });
    if (existing) {
      await prisma.siteSettings.update({ where: { id: existing.id }, data });
    } else {
      await prisma.siteSettings.create({ data });
    }
    return this.get();
  },
};
