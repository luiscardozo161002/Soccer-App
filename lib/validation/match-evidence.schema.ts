import { z } from "zod";

export const uploadMatchEvidenceSchema = z.object({
  slot: z.enum(["front", "back"]),
  photo: z.string().startsWith("data:image/", "El archivo debe ser una imagen codificada en base64"),
});
export type UploadMatchEvidenceDto = z.infer<typeof uploadMatchEvidenceSchema>;
