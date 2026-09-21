import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { createSocialThumbnail, normalizeSocialImage } from "./social-images";
import {
  socialImageCleanupPaths,
  socialThumbnailPath,
} from "./social-image-paths";

describe("social display images", () => {
  it("creates a bounded thumbnail and keeps the detail dimensions", async () => {
    const input = await sharp({
      create: { width: 1500, height: 2000, channels: 3, background: "#aabbee" },
    })
      .jpeg()
      .toBuffer();
    const display = await normalizeSocialImage(input);
    expect([display.width, display.height]).toEqual([1500, 2000]);
    const thumb = await createSocialThumbnail(display.bytes);
    const metadata = await sharp(thumb).metadata();
    expect([metadata.width, metadata.height, metadata.format]).toEqual([
      600,
      800,
      "webp",
    ]);
    expect(thumb.length).toBeLessThan(display.bytes.length);
  });

  it("never upscales small uploads", async () => {
    const input = await sharp({
      create: { width: 150, height: 200, channels: 3, background: "white" },
    })
      .png()
      .toBuffer();
    const display = await normalizeSocialImage(input);
    const thumbnail = await sharp(
      await createSocialThumbnail(display.bytes)
    ).metadata();
    expect([
      display.width,
      display.height,
      thumbnail.width,
      thumbnail.height,
    ]).toEqual([150, 200, 150, 200]);
  });

  it("rejects corrupt images", async () => {
    await expect(
      normalizeSocialImage(Buffer.from("not a photo"))
    ).rejects.toThrow("invalid_image");
  });

  it("preserves legacy media and cleans up both new variants", () => {
    expect(socialThumbnailPath("user/old.webp")).toBe("user/old.webp");
    expect(socialThumbnailPath("user/new.display.webp")).toBe(
      "user/new.thumb.webp"
    );
    expect(
      socialImageCleanupPaths(["user/old.webp", "user/new.display.webp"])
    ).toEqual([
      "user/old.webp",
      "user/new.display.webp",
      "user/new.thumb.webp",
    ]);
  });
});
