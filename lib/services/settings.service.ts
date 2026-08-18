import { optimizeImageFromDataUrl } from "@/lib/utils/images";
import { settingsRepository } from "@/lib/repositories/settings.repository";
import type { UpdateSettingsDto } from "@/lib/validation/settings.schema";
import type { Prisma } from "@/app/generated/prisma/client";

export const settingsService = {
  get() {
    return settingsRepository.get();
  },

  // Emails can't rely on the app being publicly reachable (e.g. APP_URL
  // pointing at localhost in dev) to fetch a logo by URL — and Gmail strips
  // data: URIs from <img src> outright — so callers that need the logo
  // outside the browser send it as a CID email attachment instead.
  async getLogoAttachment() {
    const row = await settingsRepository.getLogo();
    if (!row?.logo || !row.logoType) return null;
    return { content: Buffer.from(row.logo).toString("base64"), contentType: row.logoType };
  },

  async update(dto: UpdateSettingsDto) {
    const data: Prisma.SiteSettingsUncheckedUpdateInput = {
      name: dto.name,
      slogan: dto.slogan,
      primaryColor: dto.primaryColor,
      backgroundColor: dto.backgroundColor,
    };
    if (dto.logo) {
      const { buffer, type } = await optimizeImageFromDataUrl(dto.logo);
      data.logo = new Uint8Array(buffer);
      data.logoType = type;
      data.logoUpdatedAt = new Date();
    }
    return settingsRepository.update(data);
  },
};
