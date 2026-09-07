import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  origin: vi.fn(),
  read: vi.fn(),
  update: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  change: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("../auth/request-user", () => ({
  getRegisteredRequestUser: mocks.user,
  hasValidMutationOrigin: mocks.origin,
}));
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidate }));
vi.mock("../config/env.js", () => ({
  SUPABASE_STORAGE_BUCKET: "product-assets",
}));
vi.mock("../lib/supabase.js", () => ({
  assertSupabaseConfig: vi.fn(),
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ single: mocks.read }) }),
      update: (input: unknown) => {
        mocks.change(input);
        const builder = {
          eq: () => builder,
          is: () => builder,
          select: () => ({ maybeSingle: mocks.update }),
        };
        return builder;
      },
    }),
    storage: {
      from: () => ({
        upload: mocks.upload,
        remove: mocks.remove,
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://assets.example/${path}` },
        }),
      }),
    },
  },
}));
import { POST, DELETE } from "../../app/api/user/avatar/route";

const request = (file?: File) => {
  const form = new FormData();
  if (file) form.set("file", file);
  return new Request("https://digbox.example/api/user/avatar", {
    method: "POST",
    body: form,
  });
};
const png = () =>
  new File([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])], "avatar.png", {
    type: "image/png",
  });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.origin.mockReturnValue(true);
  mocks.user.mockResolvedValue({ id: "me" });
  mocks.read.mockResolvedValue({
    data: { avatar_path: "avatars/me/old.png" },
    error: null,
  });
  mocks.update.mockResolvedValue({ data: { id: "me" }, error: null });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
});

describe("profile avatar API", () => {
  it("requires origin validation and a registered session", async () => {
    mocks.origin.mockReturnValue(false);
    expect((await POST(request(png()))).status).toBe(403);
    mocks.origin.mockReturnValue(true);
    mocks.user.mockResolvedValue(null);
    expect((await DELETE(request())).status).toBe(401);
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.change).not.toHaveBeenCalled();
  });
  it("rejects spoofed MIME data and files over 3MB", async () => {
    expect(
      (
        await POST(
          request(new File(["not an image"], "x.png", { type: "image/png" }))
        )
      ).status
    ).toBe(400);
    expect(
      (
        await POST(
          request(
            new File([new Uint8Array(3 * 1024 * 1024 + 1)], "x.png", {
              type: "image/png",
            })
          )
        )
      ).status
    ).toBe(400);
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("stores a new owned path, changes the profile, then removes the previous image", async () => {
    const response = await POST(request(png()));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(body.data.avatarUrl).toMatch(
      /^https:\/\/assets.example\/avatars\/me\/.+\.png$/
    );
    expect(mocks.change).toHaveBeenCalledWith({
      avatar_path: expect.stringMatching(/^avatars\/me\//),
    });
    expect(mocks.remove).toHaveBeenCalledWith(["avatars/me/old.png"]);
    expect(mocks.revalidate).toHaveBeenCalledWith("public-digbox", {
      expire: 0,
    });
    expect(mocks.remove.mock.invocationCallOrder[0]).toBeGreaterThan(
      mocks.update.mock.invocationCallOrder[0]
    );
  });
  it("preserves the previous photo when uploading fails", async () => {
    mocks.upload.mockResolvedValue({ error: new Error("failed") });
    expect((await POST(request(png()))).status).toBe(500);
    expect(mocks.change).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalledWith(["avatars/me/old.png"]);
  });
  it("cleans the unlinked upload when a concurrent profile edit wins", async () => {
    mocks.update.mockResolvedValue({ data: null, error: null });
    expect((await POST(request(png()))).status).toBe(500);
    expect(mocks.remove).toHaveBeenCalledWith([mocks.upload.mock.calls[0][0]]);
    expect(mocks.remove).not.toHaveBeenCalledWith(["avatars/me/old.png"]);
  });
  it("removes the profile image without permitting another account's file cleanup", async () => {
    mocks.read.mockResolvedValue({
      data: { avatar_path: "avatars/other/photo.png" },
      error: null,
    });
    const response = await DELETE(request());
    expect((await response.json()).data.avatarUrl).toBeNull();
    expect(mocks.change).toHaveBeenCalledWith({ avatar_path: null });
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
