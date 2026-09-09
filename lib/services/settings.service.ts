import { optimizeImageFromDataUrl } from "@/lib/utils/images";
import { settingsRepository } from "@/lib/repositories/settings.repository";
import type { UpdateSettingsDto } from "@/lib/validation/settings.schema";
import type { Prisma } from "@/app/generated/prisma/client";

export const settingsService = {
  get() {
    return settingsRepository.get();
  },

  async getLogoAttachment() {
    const row = await settingsRepository.getLogo();
    if (!row?.logo || !row.logoType) return null;
    return { content: Buffer.from(row.logo).toString("base64"), contentType: row.logoType };
  },

  async update(dto: UpdateSettingsDto) {
    const data: Omit<Prisma.SiteSettingsUncheckedCreateInput, "id"> = {
      name: dto.name,
      slogan: dto.slogan,
      primaryColor: dto.primaryColor,
      backgroundColor: dto.backgroundColor,
    };
    if (dto.logo === null) {
      data.logo = null;
      data.logoType = null;
      data.logoUpdatedAt = null;
    } else if (dto.logo) {
      const { buffer, type } = await optimizeImageFromDataUrl(dto.logo);
      data.logo = new Uint8Array(buffer);
      data.logoType = type;
      data.logoUpdatedAt = new Date();
    }
    return settingsRepository.update(data);
  },
};
