import { expect, it } from "vitest";
import { buildClusters } from "./cluster";

// Read-only, explicit opt-in. No OpenAI calls or production model writes.
it.skipIf(process.env.TASTE_CLUSTER_LIVE_TEST !== "1")(
  "calculates clusters from real saved products",
  async () => {
    for (const file of [".env.local", ".env"]) {
      try {
        process.loadEnvFile(file);
      } catch {
        /* credentials may be supplied by runner */
      }
    }
    const { supabase } = await import("../../lib/supabase.js");
    const { getTasteSummary } = await import("../taste-analysis");
    if (!supabase) throw new Error("database_unavailable");
    const rows = await supabase
      .from("user_digbox_items")
      .select("user_id")
      .limit(1000);
    if (rows.error) throw rows.error;
    const users = [...new Set(rows.data.map((r) => r.user_id))];
    expect(users.length).toBeGreaterThan(0);
    const counts: Record<string, number> = {};
    for (const id of users) {
      const { products } = await getTasteSummary(id, "digbox");
      const result = buildClusters(products);
      counts[result.reason] = (counts[result.reason] || 0) + 1;
      expect(Number.isFinite(result.separation)).toBe(true);
      if (result.accepted) expect(result.clusters).toHaveLength(2);
    }
    console.info("Cluster read-only audit", { users: users.length, counts });
  },
  60000
);
