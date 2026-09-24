import { optimizeImageFromDataUrl } from "@/lib/utils/images";
import type { UpdateSettingsDto } from "../settings.schema";
import { settingsRepository, type SettingsWriteData } from "./settings.repository";

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
    const data: SettingsWriteData = {
      name: dto.name,
      slogan: dto.slogan,
      primaryColor: dto.primaryColor,
      backgroundColor: dto.backgroundColor,
      locale: dto.locale,
    };
    if (dto.logo === null) {
      data.logo = null;
      data.logoType = null;
      data.logoUpdatedAt = null;
    } else if (dto.logo) {
      const { buffer, type } = await optimizeImageFromDataUrl(dto.logo);
      data.logo = Uint8Array.from(buffer);
      data.logoType = type;
      data.logoUpdatedAt = new Date();
    }
    return settingsRepository.update(data);
  },
};
