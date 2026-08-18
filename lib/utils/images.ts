import sharp from "sharp";
import { ApiError } from "@/lib/errors";

const DATA_URL_RE = /^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i;
const MAX_SOURCE_BYTES = 8 * 1024 * 1024; // 8MB raw upload cap, before optimization
const OUTPUT_SIZE = 512;
const OUTPUT_TYPE = "image/webp";

export interface OptimizedImage {
  buffer: Buffer;
  type: string;
}

// Decodes a base64 data URL, resizes to a square thumbnail and re-encodes
// as webp so every stored photo is small and consistent regardless of what
// the client uploaded.
export async function optimizeImageFromDataUrl(dataUrl: string): Promise<OptimizedImage> {
  const match = dataUrl.match(DATA_URL_RE);
  if (!match) {
    throw new ApiError(
      422,
      "INVALID_IMAGE",
      "El archivo debe ser una imagen (png, jpg, webp o gif) codificada en base64"
    );
  }

  const raw = Buffer.from(match[2], "base64");
  if (raw.byteLength > MAX_SOURCE_BYTES) {
    throw new ApiError(422, "IMAGE_TOO_LARGE", "La imagen no debe superar 8MB");
  }

  try {
    const buffer = await sharp(raw)
      .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();
    return { buffer, type: OUTPUT_TYPE };
  } catch {
    throw new ApiError(422, "INVALID_IMAGE", "No se pudo procesar el archivo como imagen");
  }
}
