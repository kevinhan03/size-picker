import { describe, expect, it } from "vitest";
import type { Product } from "../../../src/types";
import { computeTasteConfidence } from "./taste-confidence";

const axes = {
  formality: 3,
  refinement: 4,
  technicality: 2,
  historical_orientation: 3,
  visual_boldness: 2,
  affective_softness: 4,
  unconventionality: 2,
  sensuality: 2,
};
const product = (id: string, withAxes = true, category = "Top") =>
  ({
    id,
    name: id,
    brand: "B",
    image: "",
    url: "",
    category,
    ...(withAxes ? { styleAxes: axes } : {}),
  }) as Product;

describe("taste confidence", () => {
  it("does not claim confidence without analyzable products", () => {
    expect(computeTasteConfidence([product("1", false)])).toMatchObject({
      analyzedCount: 0,
      confidence: 0,
      level: "none",
    });
  });

  it("increases as consistent analyzed evidence accumulates", () => {
    const sparse = computeTasteConfidence([product("1")]);
    const established = computeTasteConfidence(
      Array.from({ length: 12 }, (_, index) =>
        product(
          String(index),
          true,
          ["Top", "Bottom", "Outer", "Shoes"][index % 4]
        )
      )
    );
    expect(established.confidence).toBeGreaterThan(sparse.confidence);
    expect(established.level).toBe("high");
    expect(established.categoryCoverage).toBe(1);
  });

  it("reports missing analysis and inconsistent axes", () => {
    const opposite = { ...axes, formality: 7, refinement: 1, technicality: 7 };
    const result = computeTasteConfidence([
      product("1"),
      { ...product("2"), styleAxes: opposite },
      product("3", false),
    ]);
    expect(result.analyzableRatio).toBeCloseTo(2 / 3);
    expect(result.axisConsistency).toBeLessThan(1);
    expect(result.categoryCount).toBe(1);
  });
});
