import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Product } from "../../../src/types";
import type { AgentPlan } from "../../../src/types/fashion-agent";
import { buildClusters, fingerprint } from "./cluster";
const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  summary: vi.fn(),
}));
vi.mock("../../lib/supabase.js", () => ({
  supabase: { from: mocks.from, rpc: mocks.rpc },
}));
vi.mock("../taste-analysis", () => ({ getTasteSummary: mocks.summary }));
import { processClusterQueue, recordShadow } from "./service";
const products = Array.from({ length: 8 }, (_, i) => ({
  id: String(i),
  category: "Top",
  styleAxes: Object.fromEntries(
    [
      "formality",
      "refinement",
      "technicality",
      "historical_orientation",
      "visual_boldness",
      "affective_softness",
      "unconventionality",
      "sensuality",
    ].map((key) => [key, i < 4 ? 2 : 6])
  ),
})) as Product[];
const plan = { source: "digbox", intent: "recommend" } as AgentPlan;
let results: unknown[];
function builder(result: unknown) {
  const query: Record<string, unknown> = {
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  for (const method of [
    "select",
    "eq",
    "maybeSingle",
    "order",
    "limit",
    "update",
    "upsert",
    "insert",
  ])
    query[method] = vi.fn(() => query);
  return query;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("FASHION_AGENT_CLUSTER_SHADOW", "true");
  results = [];
  mocks.from.mockImplementation(() =>
    builder(results.shift() ?? { data: null, error: null })
  );
  mocks.rpc.mockResolvedValue({ error: null });
  mocks.summary.mockResolvedValue({ products });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
it("disabled mode performs no database calls", async () => {
  vi.stubEnv("FASHION_AGENT_CLUSTER_SHADOW", "false");
  await recordShadow("user", plan, products, products, []);
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(mocks.from).not.toHaveBeenCalled();
});
it("missing current model skips comparison", async () => {
  await recordShadow("user", plan, products, products, []);
  expect(mocks.from).toHaveBeenCalledTimes(1);
});
it("database failure does not fail recommendations", async () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  mocks.rpc.mockResolvedValue({ error: new Error("offline") });
  await expect(
    recordShadow("user", plan, products, products, [])
  ).resolves.toBeUndefined();
});
it("accepted current model writes a comparison without modifying candidates", async () => {
  results.push({
    data: { id: "model", result: buildClusters(products) },
    error: null,
  });
  const before = JSON.stringify(products);
  await recordShadow("user", plan, products, products, ["0", "1"]);
  expect(mocks.from).toHaveBeenLastCalledWith("user_taste_cluster_evaluations");
  expect(JSON.stringify(products)).toBe(before);
});
it("worker defers newly changed inputs", async () => {
  results.push({
    data: [
      {
        user_id: "user",
        source: "digbox",
        fingerprint: "stale",
        observed_at: "2020-01-01",
        processed_at: null,
      },
    ],
    error: null,
  });
  expect(await processClusterQueue()).toMatchObject({
    built: 0,
    deferred: 1,
    failed: 0,
  });
});
it("worker builds stable inputs and leaves processed unchanged inputs alone", async () => {
  results.push({
    data: [
      {
        user_id: "user",
        source: "digbox",
        fingerprint: fingerprint(products),
        observed_at: "2020-01-01",
        processed_at: null,
      },
    ],
    error: null,
  });
  expect(await processClusterQueue()).toMatchObject({ built: 1, failed: 0 });
  results.push({
    data: [
      {
        user_id: "user",
        source: "digbox",
        fingerprint: fingerprint(products),
        observed_at: "2020-01-01",
        processed_at: "2021-01-01",
      },
    ],
    error: null,
  });
  expect(await processClusterQueue()).toMatchObject({ built: 0, deferred: 1 });
});
