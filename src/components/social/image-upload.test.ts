import { describe, expect, it } from "vitest";
import { isSupportedPhoto } from "./image-upload";

describe("social photo selection", () => {
  it("accepts iPhone HEIC photos alongside existing web formats", () => {
    expect(isSupportedPhoto({ name: "photo.HEIC", type: "image/heic" })).toBe(true);
    expect(isSupportedPhoto({ name: "photo.heif", type: "" })).toBe(true);
    expect(isSupportedPhoto({ name: "photo.jpg", type: "image/jpeg" })).toBe(true);
  });

  it("rejects unsupported file formats", () => {
    expect(isSupportedPhoto({ name: "photo.gif", type: "image/gif" })).toBe(false);
  });
});
