import { beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

const database = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock("../lib/supabase.js", () => ({
  supabase: database,
  assertSupabaseConfig: vi.fn(),
}));
import { publish } from "./social";

const account = { id: randomUUID(), appUsername: "test" };
const image = () => ({ id: randomUUID(), tags: [] });
const post = (images = [image()]) => ({ id: randomUUID(), caption: "", images });

function mockRows(existing: { id: string }[], uploads: { id: string; width: number; height: number }[]) {
  database.from.mockImplementation((table: string) => {
    const result = { data: table === "social_uploads" ? uploads : existing, error: null };
    const query = {
      select: vi.fn(() => query), eq: vi.fn(() => query), in: vi.fn(() => query),
      then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
    };
    return query;
  });
}

describe("single-photo publishing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.rpc.mockResolvedValue({ data: "published", error: null });
  });
  it("rejects multiple photos before publishing a new post", async () => {
    await expect(publish(post([image(), image()]), account, false)).rejects.toThrow("invalid_input");
    expect(database.rpc).not.toHaveBeenCalled();
  });
  it("accepts a portrait 3:4 upload and rejects a landscape upload", async () => {
    const payload = post();
    mockRows([], [{ id: payload.images[0].id, width: 1500, height: 2000 }]);
    await expect(publish(payload, account, false)).resolves.toEqual({ id: "published" });
    database.rpc.mockClear();
    mockRows([], [{ id: payload.images[0].id, width: 2000, height: 1500 }]);
    await expect(publish(payload, account, false)).rejects.toThrow("invalid_image");
    expect(database.rpc).not.toHaveBeenCalled();
  });
  it("preserves existing albums and their original aspect ratios on caption edits", async () => {
    const payload = post([image(), image()]);
    mockRows(payload.images, []);
    await expect(publish(payload, account, true)).resolves.toEqual({ id: "published" });
    expect(database.from).not.toHaveBeenCalledWith("social_uploads");
    expect(database.rpc).toHaveBeenCalledWith("social_publish_post", expect.objectContaining({ payload }));
  });
  it("does not allow adding photos to an existing single-photo post", async () => {
    const payload = post([image(), image()]);
    mockRows([payload.images[0]], []);
    await expect(publish(payload, account, true)).rejects.toThrow("invalid_input");
    expect(database.rpc).not.toHaveBeenCalled();
  });
  it("validates replacement uploads even when editing an existing post", async () => {
    const payload = post();
    const replacementUploadId = randomUUID();
    const edited = { ...payload, images: [{ ...payload.images[0], replacementUploadId }] };
    mockRows(payload.images, [{ id: replacementUploadId, width: 1000, height: 1000 }]);
    await expect(publish(edited, account, true)).rejects.toThrow("invalid_image");
    expect(database.rpc).not.toHaveBeenCalled();
  });
});
