import { describe, expect, it } from "vitest";
import type { Product, StyleAxes } from "../../src/types";
import { isOutfitCategoryPair } from "../../src/utils/tasteGraph";
import { buildProductRecommendations } from "./product-recommendations";

const axes: StyleAxes = {
  formality: 3, refinement: 4, technicality: 4, historical_orientation: 3,
  visual_boldness: 3, affective_softness: 4, unconventionality: 3, sensuality: 2,
};

function product(id: string, category: string, options: Partial<Product> = {}): Product {
  return {
    id, category, brand: "Test", name: id, targetGender: "menswear",
    styleAxes: axes, imageEmbedding: [1, 0, 0],
    styleAttributes: { primary_color: "black", primary_material: "cotton", pattern: "plain", fit_volume: "regular", silhouette: "straight" },
    ...options,
  } as Product;
}

describe("product recommendation ranking", () => {
  it("keeps visually similar same-category substitutes even when their style centres differ", () => {
    const source = product("source", "Bottom");
    const candidate = product("candidate", "Bottom", { styleAxes: { ...axes, historical_orientation: 7 } });
    const result = buildProductRecommendations(source, [source, candidate], new Map([["candidate", 0.94]]));
    expect(result.similarProducts.map((entry) => entry.product.id)).toContain("candidate");
    expect(result.similarProducts.every((entry) => entry.product.category === "Bottom")).toBe(true);
  });

  it("only returns valid apparel and shoe outfit pairs", () => {
    const source = product("top", "Top");
    const bottom = product("bottom", "Bottom");
    const shoes = product("shoes", "Shoes");
    const bag = product("bag", "Bag");
    const result = buildProductRecommendations(source, [source, bottom, shoes, bag]);
    expect(result.styleProducts.map((entry) => entry.product.id)).toEqual(expect.arrayContaining(["bottom", "shoes"]));
    expect(result.styleProducts.map((entry) => entry.product.id)).not.toContain("bag");
  });

  it("distinguishes skirt and dress outfit roles", () => {
    const top = product("top", "Top");
    const skirt = product("skirt", "DressSkirt", { subCategory: "미디스커트" });
    const dress = product("dress", "DressSkirt", { subCategory: "미디원피스" });
    expect(isOutfitCategoryPair(top, skirt)).toBe(true);
    expect(isOutfitCategoryPair(top, dress)).toBe(false);
    expect(isOutfitCategoryPair(product("outer", "Outer"), dress)).toBe(true);
  });

  it("keeps older eligible outfit candidates instead of applying an id-recency rule", () => {
    const source = product("508", "Outer");
    const olderTop = product("1", "Top");
    const result = buildProductRecommendations(source, [source, olderTop]);
    expect(result.styleProducts.map((entry) => entry.product.id)).toContain("1");
  });

  it("limits outfit results to two products per category", () => {
    const source = product("outer", "Outer");
    const products = [source, ...Array.from({ length: 4 }, (_, index) => product(`bottom-${index}`, "Bottom")), ...Array.from({ length: 3 }, (_, index) => product(`top-${index}`, "Top"))];
    const result = buildProductRecommendations(source, products);
    const bottomCount = result.styleProducts.filter((entry) => entry.product.category === "Bottom").length;
    const topCount = result.styleProducts.filter((entry) => entry.product.category === "Top").length;
    expect(bottomCount).toBeLessThanOrEqual(2);
    expect(topCount).toBeLessThanOrEqual(2);
  });

  it("does not place more than two consecutive candidates from one brand or detailed category", () => {
    const source = product("source", "Bottom");
    const candidates = [
      product("a", "Bottom", { brand: "Same", subCategory: "A" }),
      product("b", "Bottom", { brand: "Same", subCategory: "B" }),
      product("c", "Bottom", { brand: "Same", subCategory: "C" }),
      product("d", "Bottom", { brand: "Other", subCategory: "C" }),
    ];
    const result = buildProductRecommendations(source, [source, ...candidates], new Map(candidates.map((candidate, index) => [candidate.id, 0.95 - index * 0.01])));
    expect(result.similarProducts.map((entry) => entry.product.id)).toEqual(["a", "b", "d"]);
  });

  it("exposes the actual outfit score components for diagnostics", () => {
    const source = product("top", "Top");
    const bottom = product("bottom", "Bottom");
    const result = buildProductRecommendations(source, [source, bottom]);
    expect(result.styleProducts[0].diagnostics.components).toMatchObject({
      categoryPair: 1,
      outfitAxes: expect.any(Number),
      colorHarmony: 1,
    });
  });

  it("ranks safely when color and silhouette attributes are missing", () => {
    const source = product("source", "Bottom", { styleAttributes: null });
    const top = product("top", "Top", { styleAttributes: null });
    expect(() => buildProductRecommendations(source, [source, top])).not.toThrow();
  });
});
