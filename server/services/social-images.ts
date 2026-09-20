import sharp from "sharp";
import { SocialError } from "./social-validation";
export const MAX_SOCIAL_UPLOAD_IMAGE_BYTES = 3 * 1024 * 1024;
export const MAX_SOCIAL_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;

export async function normalizeSocialImage(
  bytes: Buffer,
  maxInputBytes = MAX_SOCIAL_UPLOAD_IMAGE_BYTES
) {
  if (!bytes.length || bytes.length > maxInputBytes)
    throw new SocialError("invalid_image");
  try {
    const image = sharp(bytes, {
      limitInputPixels: 40_000_000,
      animated: false,
    });
    const metadata = await image.metadata();
    if (
      !metadata.format ||
      !["jpeg", "png", "webp", "heif"].includes(metadata.format) ||
      (metadata.pages || 1) > 1
    )
      throw new Error();
    const resized = image
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      });
    for (const quality of [85, 75, 65, 55, 45]) {
      const result = await resized
        .clone()
        .webp({ quality })
        .toBuffer({ resolveWithObject: true });
      if (result.data.length <= MAX_SOCIAL_UPLOAD_IMAGE_BYTES)
        return {
          bytes: result.data,
          width: result.info.width,
          height: result.info.height,
        };
    }
    throw new Error();
  } catch {
    throw new SocialError("invalid_image");
  }
}
