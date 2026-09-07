import { describe, expect, it } from "vitest";
import { avatarMime, AVATAR_MAX_BYTES, ownedAvatar } from "./avatar";

describe("avatar validation", () => {
  it("recognizes JPEG, PNG and WebP signatures", () => {
    expect(avatarMime(Uint8Array.from([255, 216, 255, 224]))).toBe(
      "image/jpeg"
    );
    expect(avatarMime(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(
      "image/png"
    );
    expect(avatarMime(Buffer.from("RIFF0000WEBP"))).toBe("image/webp");
  });
  it("rejects empty, oversized and disguised images", () => {
    expect(avatarMime(new Uint8Array())).toBeNull();
    expect(avatarMime(new Uint8Array(AVATAR_MAX_BYTES + 1))).toBeNull();
    expect(avatarMime(Buffer.from("<svg onload='bad()'></svg>"))).toBeNull();
  });
  it("only cleans up avatar paths owned by the current account", () => {
    expect(ownedAvatar("avatars/me/file.png", "me")).toBe(true);
    for (const path of [
      null,
      "submissions/file.png",
      "avatars/other/file.png",
      "avatars/me/../other/file.png",
    ])
      expect(ownedAvatar(path, "me")).toBe(false);
  });
});
