import { optimizeImageFromDataUrl } from "@/lib/images";
import { settingsRepository } from "@/lib/repositories/settings.repository";
import type { UpdateSettingsDto } from "@/lib/validation/settings.schema";
import type { Prisma } from "@/app/generated/prisma/client";

export const settingsService = {
  get() {
    return settingsRepository.get();
  },

  async update(dto: UpdateSettingsDto) {
    const data: Prisma.SiteSettingsUncheckedUpdateInput = {
      name: dto.name,
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
