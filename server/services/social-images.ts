import sharp from "sharp";
import { SocialError } from "./social-validation";
export async function normalizeSocialImage(bytes: Buffer) {
  if (!bytes.length || bytes.length > 3 * 1024 * 1024)
    throw new SocialError("invalid_image");
  try {
    const image = sharp(bytes, {
      limitInputPixels: 40_000_000,
      animated: false,
    });
    const metadata = await image.metadata();
    if (
      !metadata.format ||
      !["jpeg", "png", "webp"].includes(metadata.format) ||
      (metadata.pages || 1) > 1
    )
      throw new Error();
    const result = await image
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
    return {
      bytes: result.data,
      width: result.info.width,
      height: result.info.height,
    };
  } catch {
    throw new SocialError("invalid_image");
  }
}
