import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ download: vi.fn(), upload: vi.fn(), row: vi.fn(), render: vi.fn() }));
vi.mock("../config/env.js", () => ({ SUPABASE_PRODUCTS_TABLE: "products", SUPABASE_STORAGE_BUCKET: "assets" }));
vi.mock("../utils/card-thumbnail-path.js", () => ({ cardThumbnailLocation: () => ({ path: "card-thumbnails/v1/1/hash.webp", source: "original.jpg" }) }));
vi.mock("./card-thumbnail", () => ({ createCardThumbnail: mocks.render }));
vi.mock("../lib/supabase.js", () => ({
  assertSupabaseConfig: vi.fn(),
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.row }) }) }),
    storage: { from: () => ({ download: mocks.download, upload: mocks.upload }) },
  },
}));
import { ensureStoredCardThumbnail } from "./stored-card-thumbnail";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.row.mockResolvedValue({ data: { image_path: "original.jpg" }, error: null });
  mocks.render.mockResolvedValue({ bytes: Buffer.from("generated") });
  mocks.upload.mockResolvedValue({ error: null });
});

describe("stored card thumbnail preparation", () => {
  it("reuses an existing thumbnail without processing or overwriting", async () => {
    mocks.download.mockResolvedValue({ data: new Blob(["cached"]), error: null });
    expect((await ensureStoredCardThumbnail("1")).toString()).toBe("cached");
    expect(mocks.render).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("deduplicates concurrent requests and writes a new derivative without upsert", async () => {
    mocks.download.mockResolvedValueOnce({ data: null, error: { statusCode: "404" } })
      .mockResolvedValueOnce({ data: new Blob(["original"]), error: null });
    await Promise.all([ensureStoredCardThumbnail("2"), ensureStoredCardThumbnail("2")]);
    expect(mocks.render).toHaveBeenCalledTimes(1);
    expect(mocks.upload).toHaveBeenCalledWith("card-thumbnails/v1/1/hash.webp", Buffer.from("generated"), expect.objectContaining({ upsert: false }));
  });
  it("does not treat an outage as a missing file and permits a later retry", async () => {
    mocks.download.mockResolvedValueOnce({ data: null, error: { statusCode: "500" } });
    await expect(ensureStoredCardThumbnail("3")).rejects.toEqual({ statusCode: "500" });
    expect(mocks.render).not.toHaveBeenCalled();
    mocks.download.mockResolvedValueOnce({ data: new Blob(["recovered"]), error: null });
    expect((await ensureStoredCardThumbnail("3")).toString()).toBe("recovered");
  });
});
