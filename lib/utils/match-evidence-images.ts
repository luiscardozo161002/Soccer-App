import sharp from "sharp";
import { ApiError } from "@/lib/errors";
import { decodeImageDataUrl, type OptimizedImage } from "@/lib/utils/images";

const MAX_DIMENSION = 1600;
const OUTPUT_TYPE = "image/webp";

// Evidence photos (scoreboards, the field) shouldn't be force-cropped to a
// square like an avatar — this preserves aspect ratio, only capping the
// longest side.
export async function optimizeEvidenceImageFromDataUrl(dataUrl: string): Promise<OptimizedImage> {
  const raw = decodeImageDataUrl(dataUrl);
  try {
    const buffer = await sharp(raw)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    return { buffer, type: OUTPUT_TYPE };
  } catch {
    throw new ApiError(422, "INVALID_IMAGE", "No se pudo procesar el archivo como imagen");
  }
}
