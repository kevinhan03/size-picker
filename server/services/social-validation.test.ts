import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { decodeCursor, validatePost } from "./social-validation";
import { normalizeSocialImage } from "./social-images";
describe("social input boundaries", () => {
  it("allows no tags but rejects unsafe coordinates and duplicate images", () => {
    const p = {
      id: randomUUID(),
      caption: "",
      images: [
        {
          id: randomUUID(),
          tags: [] as { productId: string; x: number; y: number }[],
        },
      ],
    };
    expect(validatePost(p)).toBe(p);
    expect(() =>
      validatePost({ ...p, images: [p.images[0], p.images[0]] })
    ).toThrow();
    expect(() =>
      validatePost({
        ...p,
        images: [{ ...p.images[0], tags: [{ productId: "1", x: NaN, y: 0 }] }],
      })
    ).toThrow();
    expect(() => validatePost({ ...p, caption: "x".repeat(2201) })).toThrow();
  });
  it("rejects invalid/injected cursor components", () => {
    expect(() =>
      decodeCursor(
        Buffer.from(
          JSON.stringify({
            id: randomUUID(),
            at: "2026-01-01),status.eq.draft",
          })
        ).toString("base64url")
      )
    ).toThrow();
    expect(decodeCursor(null)).toBeNull();
  });
  it("decodes real images and rejects disguised/non-image payloads", async () => {
    const input = await sharp({
      create: { width: 20, height: 30, channels: 3, background: "red" },
    })
      .jpeg()
      .withMetadata()
      .toBuffer();
    const result = await normalizeSocialImage(input);
    expect(result.width).toBe(20);
    expect(result.height).toBe(30);
    const meta = await sharp(result.bytes).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.exif).toBeUndefined();
    await expect(
      normalizeSocialImage(Buffer.from("<svg></svg>"))
    ).rejects.toThrow("invalid_image");
    await expect(
      normalizeSocialImage(Buffer.alloc(3 * 1024 * 1024 + 1))
    ).rejects.toThrow("invalid_image");
  });
});
