import { describe, expect, it } from "vitest";
import { emptyFilters, resolveReferences, validatePlan } from "./contracts";
import { axisSimilarity, matchesFilters } from "./engine";
import type { AgentPlan } from "../../../src/types/fashion-agent";
import type { Product, StyleAxes } from "../../../src/types";

export const plan = (): AgentPlan => ({
  intent: "search",
  filters: emptyFilters(),
  personalized: false,
  exploration: false,
  source: "digbox",
  productIds: [],
  resultPositions: [],
  reference: null,
  unsupported: [],
  question: null,
});
const axes: StyleAxes = {
  formality: 4,
  refinement: 7,
  technicality: 2,
  historical_orientation: 2,
  visual_boldness: 1,
  affective_softness: 5,
  unconventionality: 2,
  sensuality: 3,
};
const product: Product = {
  id: "12",
  brand: "Brand",
  name: "Trousers",
  category: "Bottom",
  image: "",
  url: "",
  styleAxes: axes,
  styleAttributes: { primary_color: "black", silhouette: "wide" },
};
describe("fashion agent contracts and ranking", () => {
  it("does not require translated fact words to also appear in the product name", () => {
    const p = plan();
    p.filters.category = "Bottom";
    p.filters.facts = [
      { key: "primary_color", value: "black" },
      { key: "silhouette", value: "wide" },
    ];
    p.filters.keywords = ["검정", "와이드 팬츠", "Selvedge"];
    expect(validatePlan(p).filters.keywords).toEqual(["Selvedge"]);
    expect(() =>
      validatePlan({ ...p, filters: { ...p.filters, subCategory: "pants" } })
    ).toThrow();
  });
  it("resolves the second displayed card without trusting invented model IDs", () => {
    expect(
      resolveReferences(
        { ...plan(), resultPositions: [2] },
        ["12", "34"],
        "두 번째와 어울리는 바지"
      )
    ).toEqual(["34"]);
    expect(() =>
      resolveReferences(
        { ...plan(), productIds: ["999"] },
        ["12"],
        "이거랑 비슷한 상품"
      )
    ).toThrow("unknown_product_reference");
    expect(() =>
      resolveReferences({ ...plan(), resultPositions: [3] }, ["12"], "세번째")
    ).toThrow();
    expect(
      resolveReferences(
        { ...plan(), productIds: ["34"] },
        [],
        "https://digbox.test/product/34-jacket"
      )
    ).toEqual(["34"]);
  });
  it("rejects incomplete, unknown, oversized and inverted model fields", () => {
    expect(validatePlan(plan())).toEqual({
      ...plan(),
      followUp: null,
      session: {
        candidateScope: "catalog",
        novelty: "none",
        axisPreferences: [],
      },
    });
    expect(() =>
      validatePlan({ ...plan(), sql: "select * from users" })
    ).toThrow();
    expect(() =>
      validatePlan({
        ...plan(),
        filters: {
          ...emptyFilters(),
          axes: [{ key: "formality", min: 7, max: 1 }],
        },
      })
    ).toThrow();
    expect(() =>
      validatePlan({
        ...plan(),
        filters: {
          ...emptyFilters(),
          facts: [{ key: "primary_color", value: "secret" }],
        },
      })
    ).toThrow();
    expect(() => validatePlan({ ...plan(), resultPositions: [0] })).toThrow();
    expect(() =>
      validatePlan({ ...plan(), question: "a".repeat(301) })
    ).toThrow();
  });
  it("drops a valid but cross-category subcategory instead of failing the request", () => {
    const result = validatePlan({
      ...plan(),
      filters: {
        ...emptyFilters(),
        category: "Bottom",
        subCategory: "셔츠·블라우스",
      },
      reference: {
        source: "closet",
        filters: {
          ...emptyFilters(),
          category: "Bottom",
          subCategory: "셔츠·블라우스",
        },
      },
    });
    expect(result.filters.subCategory).toBeNull();
    expect(result.reference?.filters.subCategory).toBeNull();
  });
  it("never matches missing facts or axes and respects reviewed replacements", () => {
    const p = {
      ...plan(),
      filters: {
        ...emptyFilters(),
        facts: [
          { key: "primary_color", value: "black" },
          { key: "silhouette", value: "wide" },
        ],
      },
    };
    expect(matchesFilters(product, p)).toBe(true);
    expect(matchesFilters({ ...product, styleAttributes: null }, p)).toBe(
      false
    );
    expect(
      matchesFilters(
        {
          ...product,
          humanStyleAttributes: { primary_color: "white" },
          factsReviewedAt: "2026-09-17",
        },
        p
      )
    ).toBe(false);
    expect(
      matchesFilters(
        { ...product, humanStyleAttributes: { primary_color: "white" } },
        p
      )
    ).toBe(true);
    expect(
      matchesFilters(
        { ...product, styleAxes: null },
        {
          ...plan(),
          filters: {
            ...emptyFilters(),
            axes: [{ key: "formality", min: 1, max: 7 }],
          },
        }
      )
    ).toBe(false);
  });
  it("derives a taste score from actual axes and preserves unknowns", () => {
    expect(axisSimilarity(product, axes)).toBe(1);
    expect(axisSimilarity(product, {})).toBeNull();
    expect(axisSimilarity({ ...product, styleAxes: null }, axes)).toBeNull();
    expect(
      axisSimilarity({ ...product, styleAxes: { ...axes, formality: 7 } }, axes)
    ).toBeLessThan(1);
  });
});
