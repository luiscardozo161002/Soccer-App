import { resolveImageUpdate } from "@/lib/utils/images";
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
    const logoUpdate = await resolveImageUpdate(dto.logo);
    if (logoUpdate) {
      data.logo = logoUpdate.bytes;
      data.logoType = logoUpdate.type;
      data.logoUpdatedAt = logoUpdate.updatedAt;
    }
    return settingsRepository.update(data);
  },
};
