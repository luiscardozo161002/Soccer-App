import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un color hexadecimal, ej. #0d9488");

export const updateSettingsSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  primaryColor: hexColor.optional(),
  backgroundColor: hexColor.optional(),
  logo: z
    .string()
    .startsWith("data:image/", "El logo debe ser una imagen codificada en base64")
    .optional(),
});
export type UpdateSettingsDto = z.infer<typeof updateSettingsSchema>;
