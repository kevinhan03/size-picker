import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  current: null as { id: string; username?: string; bio?: string; avatar_path?: string | null } | null,
  alias: null as { user_id: string } | null,
  error: null as Error | null,
  tables: vi.fn(),
  pattern: vi.fn(),
  publicProducts: vi.fn(),
}));
vi.mock("../config/env.js", () => ({
  SUPABASE_STORAGE_BUCKET: "product-assets",
}));
vi.mock("../lib/supabase.js", () => ({
  assertSupabaseConfig: vi.fn(),
  supabase: {
    rpc: (name: string, args: Record<string, unknown>) => {
      state.tables(`rpc:${name}`);
      return state.publicProducts(args);
    },
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
  state.current = { id: "owner", username: "current_name", bio: "Public bio", avatar_path: null };
  state.alias = null;
  state.error = null;
  state.publicProducts.mockResolvedValue({
    data: [
      {
        id: "item",
        brand: "Brand",
        name: "Item",
        category: "Top",
        url: "",
        image: "",
        size_decision_note: "PRIVATE_FIT",
        discovered_save_count: 77,
      },
    ],
    error: null,
  });
});
describe("public profile service", () => {
  it("only loads public identity and the dedicated public-product RPC", async () => {
    const result = await getPublicProfile("current_name");
    expect(state.publicProducts).toHaveBeenCalledWith({ target_user_id: "owner" });
    expect(state.tables.mock.calls.flat()).toEqual(["users", "rpc:get_public_profile_products"]);
    expect(JSON.stringify(result)).not.toMatch(
      /discoveredDigboxCounts|closetSelected|digboxSizeDecision|size_decision/
    );
    expect(result?.username).toBe("current_name");
    expect(state.pattern).toHaveBeenCalledWith("current\\_name");
  });
  it("resolves an active former username to the same profile", async () => {
    state.current = null;
    state.alias = { user_id: "renamed-owner" };
    expect((await getPublicProfile("former"))?.username).toBe("current_name");
    expect(state.publicProducts).toHaveBeenCalledWith({ target_user_id: "renamed-owner" });
  });
  it("returns not found when neither a current name nor an active alias exists", async () => {
    state.current = null;
    expect(await getPublicProfile("missing")).toBeNull();
    expect(state.publicProducts).not.toHaveBeenCalled();
  });
  it("propagates a read error instead of presenting an empty profile", async () => {
    state.error = new Error("database unavailable");
    await expect(getPublicProfile("current_name")).rejects.toThrow(
      "database unavailable"
    );
  });
});
