import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  from: vi.fn(),
  storage: { from: vi.fn() },
}));

vi.mock("../lib/supabase.js", () => ({
  supabase: database,
  assertSupabaseConfig: vi.fn(),
}));

import { deletePost } from "./social";

function query(data: unknown, error: { message: string } | null = null) {
  const result = { data, error };
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    delete: vi.fn(() => chain),
    in: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  return chain;
}

describe("social post deletion", () => {
  it("removes post media from Storage immediately and clears its retry queue", async () => {
    const account = { id: randomUUID(), appUsername: "test" };
    const postId = randomUUID();
    const paths = ["test/one.webp", "test/two.webp"];
    const cleanup = query(null);
    database.from
      .mockReturnValueOnce(query({ id: postId, user_id: account.id }))
      .mockReturnValueOnce(query(paths.map((image_path) => ({ image_path }))))
      .mockReturnValueOnce(query(null))
      .mockReturnValueOnce(cleanup);
    const remove = vi.fn().mockResolvedValue({ data: [], error: null });
    database.storage.from.mockReturnValue({ remove });

    await expect(deletePost(postId, account)).resolves.toEqual({
      deleted: true,
      storageCleanupPending: false,
    });
    expect(remove).toHaveBeenCalledWith(paths);
    expect(cleanup.in).toHaveBeenCalledWith("path", paths);
  });
});
