import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isSupportedPhoto,
  preparePhoto,
  renderPhotoEdit,
} from "./image-upload";

describe("social photo selection", () => {
  it("accepts iPhone HEIC photos alongside existing web formats", () => {
    expect(isSupportedPhoto({ name: "photo.HEIC", type: "image/heic" })).toBe(
      true
    );
    expect(isSupportedPhoto({ name: "photo.heif", type: "" })).toBe(true);
    expect(isSupportedPhoto({ name: "photo.jpg", type: "image/jpeg" })).toBe(
      true
    );
  });

  it("rejects unsupported file formats", () => {
    expect(isSupportedPhoto({ name: "photo.gif", type: "image/gif" })).toBe(
      false
    );
  });
});

describe("photo compression on Safari", () => {
  afterEach(() => vi.unstubAllGlobals());

  function mockCanvas(webpSupported = false, width = 4032, height = 3024) {
    const close = vi.fn();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({
        width,
        height,
        close,
      })
    );
    const ctx = {
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
    };
    const dimensions: { width: number; height: number }[] = [];
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ctx,
      toBlob: vi.fn(),
    };
    const toBlob = vi.fn(
      (callback: BlobCallback, type: string, quality: number) => {
        dimensions.push({ width: canvas.width, height: canvas.height });
        const actualType =
          type === "image/webp" && !webpSupported ? "image/png" : type;
        const large = actualType === "image/png" || quality > 0.75;
        callback(
          new Blob([new Uint8Array(large ? 4 * 1024 * 1024 : 1000)], {
            type: actualType,
          })
        );
      }
    );
    canvas.toBlob = toBlob;
    vi.stubGlobal("document", { createElement: () => canvas });
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    return { toBlob, close, fetch, dimensions, canvas };
  }

  it("compresses locally to JPEG when Safari returns oversized PNG for WebP", async () => {
    const { toBlob, close, fetch } = mockCanvas();
    const result = await renderPhotoEdit(
      new File(["photo"], "photo.jpg", { type: "image/jpeg" }),
      {
        aspect: 3 / 4,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      }
    );
    expect(result.type).toBe("image/jpeg");
    expect(result.size).toBeLessThanOrEqual(3 * 1024 * 1024);
    expect(toBlob.mock.calls.map((call) => call[1])).toEqual([
      "image/webp",
      "image/jpeg",
      "image/jpeg",
    ]);
    expect(fetch).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();
  });

  it("allows the default portrait crop to complete with JPEG fallback", async () => {
    mockCanvas();
    const result = await renderPhotoEdit(
      new Blob(["photo"], { type: "image/jpeg" }),
      {
        aspect: 3 / 4,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      }
    );
    expect(result.type).toBe("image/jpeg");
    expect(result.size).toBeLessThanOrEqual(3 * 1024 * 1024);
  });

  it("preserves WebP compression on browsers that support it", async () => {
    const { toBlob } = mockCanvas(true);
    const result = await renderPhotoEdit(
      new File(["photo"], "photo.jpg", { type: "image/jpeg" }),
      {
        aspect: 3 / 4,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      }
    );
    expect(result.type).toBe("image/webp");
    expect(toBlob.mock.calls.every((call) => call[1] === "image/webp")).toBe(
      true
    );
  });

  it("keeps the original editing source without lossy selection-time compression", async () => {
    const { toBlob, fetch } = mockCanvas();
    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    expect(await preparePhoto(file)).toBe(file);
    expect(toBlob).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not enlarge a small photo, even after zooming, and retains exact 3:4", async () => {
    const { dimensions, canvas } = mockCanvas(true, 301, 401);
    await renderPhotoEdit(new Blob(["photo"]), {
      aspect: 3 / 4,
      zoom: 2,
      offsetX: 0,
      offsetY: 0,
    });
    expect(dimensions[0]).toEqual({ width: 150, height: 200 });
    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
  });

  it("distinguishes source size and format errors before decoding", async () => {
    mockCanvas();
    await expect(
      preparePhoto(new File(["gif"], "x.gif", { type: "image/gif" }))
    ).rejects.toThrow("image_unsupported");
    await expect(
      preparePhoto(
        new File([new Uint8Array(20 * 1024 * 1024 + 1)], "x.jpg", {
          type: "image/jpeg",
        })
      )
    ).rejects.toThrow("image_too_large");
  });
});
