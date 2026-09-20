import { describe, expect, it } from "vitest";
import type { Product, StyleAxes } from "../../../src/types";
import type { AgentPlan } from "../../../src/types/fashion-agent";
import { observeQueryTaste } from "./query-taste-observation";

const axes = (value: number): StyleAxes => ({
  formality: value,
  refinement: value,
  technicality: value,
  historical_orientation: value,
  visual_boldness: value,
  affective_softness: value,
  unconventionality: value,
  sensuality: value,
});
const product = (id: string, value: number) =>
  ({
    id,
    category: "Top",
    name: id,
    brand: "Test",
    image: "",
    url: "",
    styleAxes: axes(value),
    styleAttributes: { primary_color: value > 4 ? "black" : "white" },
  }) as Product;
const plan = (overrides: Partial<AgentPlan> = {}) =>
  ({
    intent: "recommend",
    source: "digbox",
    personalized: true,
    exploration: false,
    productIds: [],
    resultPositions: [],
    reference: null,
    unsupported: [],
    question: null,
    filters: {
      category: "Top",
      subCategory: null,
      brand: null,
      keywords: [],
      facts: [],
      axes: [],
      preferredStyles: [],
      avoidedStyles: [],
      targetGender: null,
    },
    session: {
      candidateScope: "catalog",
      novelty: "none",
      axisPreferences: [],
    },
    ...overrides,
  }) as AgentPlan;
describe("query taste observation", () => {
  const products = [
    product("one", 2),
    product("two", 2),
    product("three", 5),
    product("four", 6),
    product("five", 7),
  ];
  it("does not invent an anchor set for a broad request", () => {
    const result = observeQueryTaste(products, plan());
    expect(result.reason).toBe("broad_query");
    expect(result.anchors).toEqual([]);
  });
  it("measures axis-directed anchor candidates without ranking products", () => {
    const result = observeQueryTaste(
      products,
      plan({
        session: {
          candidateScope: "catalog",
          novelty: "none",
          axisPreferences: [{ key: "formality", target: 7 }],
        },
      })
    );
    expect(result.signalTypes).toEqual(["axes"]);
    expect(result.anchors.slice(0, 2).map((item) => item.id)).toEqual([
      "five",
      "four",
    ]);
    expect(result.metrics.top4Mean).not.toBeNull();
    expect(result.metrics.localGlobalDistance).toBeGreaterThan(0);
  });
  it("treats an exact product fact as a condition, not a local taste direction", () => {
    const result = observeQueryTaste(
      products,
      plan({
        filters: {
          ...plan().filters,
          facts: [{ key: "primary_color", value: "black" }],
        },
      })
    );
    expect(result.signalTypes).toEqual(["facts"]);
    expect(result.reason).toBe("condition_only");
    expect(result.anchors).toEqual([]);
  });
});
