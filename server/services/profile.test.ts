import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  current: null as { id: string } | null,
  alias: null as { user_id: string } | null,
  error: null as Error | null,
  tables: vi.fn(),
  pattern: vi.fn(),
  saved: vi.fn(),
}));
vi.mock("./user-collections", () => ({ getDigboxProducts: state.saved }));
vi.mock("../config/env.js", () => ({
  SUPABASE_STORAGE_BUCKET: "product-assets",
}));
vi.mock("../lib/supabase.js", () => ({
  assertSupabaseConfig: vi.fn(),
  supabase: {
    from: (table: string) => {
      state.tables(table);
      const query = {
        select: () => query,
        eq: () => query,
        gt: () => query,
        ilike: (_column: string, pattern: string) => {
          state.pattern(pattern);
          return query;
        },
        maybeSingle: async () => ({
          data: table === "username_aliases" ? state.alias : state.current,
          error: state.error,
        }),
        single: async () => ({
          data: {
            username: "current_name",
            bio: "Public bio",
            avatar_path: null,
          },
          error: null,
        }),
      };
      return query;
    },
  },
}));
import { getPublicProfile } from "./profile";
beforeEach(() => {
  vi.clearAllMocks();
  state.current = { id: "owner" };
  state.alias = null;
  state.error = null;
  state.saved.mockResolvedValue({
    products: [
      {
        id: "item",
        brand: "Brand",
        name: "Item",
        category: "Top",
        url: "",
        image: "",
        digboxSizeDecision: { note: "PRIVATE_FIT" },
        closetSelectedSizeLabel: "PRIVATE_SIZE",
      },
    ],
    discoveredDigboxCounts: { item: 77 },
  });
});
describe("public profile service", () => {
  it("only loads public identity and saved products, never closet or my sizes", async () => {
    const result = await getPublicProfile("current_name");
    expect(state.saved).toHaveBeenCalledWith("owner");
    expect(state.tables.mock.calls.flat()).toEqual(["users", "users"]);
    expect(JSON.stringify(result)).not.toMatch(
      /PRIVATE_|discoveredDigboxCounts|closetSelected|digboxSizeDecision/
    );
    expect(result?.username).toBe("current_name");
    expect(state.pattern).toHaveBeenCalledWith("current\\_name");
  });
  it("resolves an active former username to the same profile", async () => {
    state.current = null;
    state.alias = { user_id: "renamed-owner" };
    expect((await getPublicProfile("former"))?.username).toBe("current_name");
    expect(state.saved).toHaveBeenCalledWith("renamed-owner");
  });
  it("returns not found when neither a current name nor an active alias exists", async () => {
    state.current = null;
    expect(await getPublicProfile("missing")).toBeNull();
    expect(state.saved).not.toHaveBeenCalled();
  });
  it("propagates a read error instead of presenting an empty profile", async () => {
    state.error = new Error("database unavailable");
    await expect(getPublicProfile("current_name")).rejects.toThrow(
      "database unavailable"
    );
  });
});
