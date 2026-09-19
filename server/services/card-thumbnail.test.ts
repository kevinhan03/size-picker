import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { createCardThumbnail } from "./card-thumbnail";

describe("card thumbnails", () => {
  it("trims a plain border and preserves the whole coloured subject on a 4:5 canvas", async () => {
    const subject = await sharp({ create: { width: 160, height: 240, channels: 3, background: "#ff0000" } }).png().toBuffer();
    const input = await sharp({ create: { width: 400, height: 500, channels: 3, background: "white" } })
      .composite([{ input: subject, left: 120, top: 130 }]).png().toBuffer();
    const result = await createCardThumbnail(input);
    expect(result.trimmed).toBe(true);
    const { data, info } = await sharp(result.bytes).raw().toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([640, 800]);
    expect([...data.subarray(0, 3)].every(v => v >= 245)).toBe(true);
    const center = ((400 * 640) + 320) * info.channels;
    expect(data[center]).toBeGreaterThan(230);
    expect(data[center + 1]).toBeLessThan(20);
  });

  it("does not trim a low contrast white subject or crop edge-to-edge photography", async () => {
    for (const background of ["#ffffff", "#345678"]) {
      const input = await sharp({ create: { width: 120, height: 600, channels: 3, background } }).png().toBuffer();
      const result = await createCardThumbnail(input);
      expect(result.trimmed).toBe(false);
      const meta = await sharp(result.bytes).metadata();
      expect([meta.width, meta.height]).toEqual([640, 800]);
    }
  });

  it("rejects corrupt images", async () => {
    await expect(createCardThumbnail(Buffer.from("not an image"))).rejects.toThrow();
  });
});
