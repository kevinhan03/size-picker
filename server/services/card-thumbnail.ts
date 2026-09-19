import sharp from "sharp";

// Version the storage key whenever the visual treatment changes.
const WIDTH = 640;
const HEIGHT = 800;

/** Only trim near-identical, light neutral borders. Never guess a garment mask. */
export async function createCardThumbnail(input: Buffer) {
  if (!input.length || input.length > 10 * 1024 * 1024) throw new Error("invalid image size");
  const { data, info } = await sharp(input, { limitInputPixels: 24_000_000 })
    .rotate().flatten({ background: "#f5f5f5" }).toColourspace("srgb")
    .removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const rgb = (x: number, y: number) => {
    const i = (y * width + x) * channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const corners = [rgb(0, 0), rgb(width - 1, 0), rgb(0, height - 1), rgb(width - 1, height - 1)];
  const background = corners[0].map((_, c) => Math.round(corners.reduce((sum, color) => sum + color[c], 0) / 4));
  const matches = (color: number[]) => color.every((value, c) => Math.abs(value - background[c]) <= 6);
  const neutral = Math.min(...background) >= 190 && Math.max(...background) - Math.min(...background) <= 12;
  let uniform = neutral && corners.every(matches);
  // Check the whole perimeter: a model touching an edge disables trimming.
  for (let x = 0; uniform && x < width; x++) uniform = matches(rgb(x, 0)) && matches(rgb(x, height - 1));
  for (let y = 0; uniform && y < height; y++) uniform = matches(rgb(0, y)) && matches(rgb(width - 1, y));
  let left = 0, top = 0, right = width - 1, bottom = height - 1;
  if (uniform) {
    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!matches(rgb(x, y))) {
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
    }
    // Reject near-blank/ambiguous images and leave a generous safety margin.
    if (maxX - minX >= width * 0.3 && maxY - minY >= height * 0.3) {
      const margin = Math.ceil(Math.max(width, height) * 0.04);
      left = Math.max(0, Math.min(minX - margin, Math.floor(width * 0.2)));
      top = Math.max(0, Math.min(minY - margin, Math.floor(height * 0.2)));
      right = Math.min(width - 1, Math.max(maxX + margin, Math.ceil(width * 0.8)));
      bottom = Math.min(height - 1, Math.max(maxY + margin, Math.ceil(height * 0.8)));
    }
  }
  const fill = uniform ? { r: background[0], g: background[1], b: background[2] } : { r: 245, g: 245, b: 245 };
  const bytes = await sharp(data, { raw: info })
    .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
    .resize(WIDTH, HEIGHT, { fit: "contain", background: fill })
    .webp({ quality: 86 }).toBuffer();
  return { bytes, trimmed: left > 0 || top > 0 || right < width - 1 || bottom < height - 1 };
}
