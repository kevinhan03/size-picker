import { describe, expect, it } from "vitest";
import type { Product } from "../types";
import { profileActivity, profileTab, publicProfileProduct } from "./profile";
import { computeTasteSummary, describeTasteCollection } from "./tasteGraph";

const now = Date.parse("2026-09-05T12:00:00Z");
const item = (id: string, overrides: Partial<Product> = {}): Product => ({
  id,
  brand: "Brand",
  name: id,
  category: "Top",
  url: "",
  image: "",
  ...overrides,
});

describe("profile activity", () => {
  it("orders by collection time, not catalog registration, and puts missing dates last", () => {
    const products = [
      item("missing", { createdAt: "2030-01-01" }),
      item("older", { collectionAddedAt: "2026-09-01" }),
      item("latest", { collectionAddedAt: "2026-09-04" }),
      item("invalid", { collectionAddedAt: "invalid" }),
      item("oldest", { collectionAddedAt: "2026-08-01" }),
    ];
    expect(profileActivity(products, now).recent.map((p) => p.id)).toEqual([
      "latest",
      "older",
      "oldest",
      "missing",
    ]);
    expect(products[0].id).toBe("missing");
  });
  it("ranks normalized brands within 30 days, breaking ties by latest save", () => {
    const products = [
      item("1", { brand: "Alpha", collectionAddedAt: "2026-09-04" }),
      item("2", { brand: " alpha ", collectionAddedAt: "2026-09-02" }),
      item("3", { brand: "Beta", collectionAddedAt: "2026-09-03" }),
      item("4", { brand: "Beta", collectionAddedAt: "2026-09-01" }),
      item("5", { brand: "Old", collectionAddedAt: "2026-01-01" }),
      item("6", { brand: "Missing" }),
      item("7", { brand: "Future", collectionAddedAt: "2027-01-01" }),
    ];
    expect(
      profileActivity(products, now).brands.map((b) => [b.name, b.count])
    ).toEqual([
      ["Alpha", 2],
      ["Beta", 2],
    ]);
  });
  it("changes immediately when a product is removed and supports empty profiles", () => {
    const products = [item("1", { collectionAddedAt: "2026-09-04" })];
    expect(profileActivity(products, now).brands).toHaveLength(1);
    expect(
      profileActivity(
        products.filter((p) => p.id !== "1"),
        now
      )
    ).toEqual({ recent: [], brands: [] });
  });
  it("defaults unsupported tabs to saved", () => {
    expect(profileTab("closet")).toBe("closet");
    for (const value of [null, undefined, "", "feed", "settings"])
      expect(profileTab(value)).toBe("saved");
  });
});

describe("public profile boundary", () => {
  it("excludes fit decisions, closet sizes and internal review identities", () => {
    const value = item("1", {
      closetSelectedSizeLabel: "L",
      closetSelectedSizeRowIndex: 1,
      closetSelectedSizeSnapshot: { headers: ["size"], row: ["L"] },
      digboxSizeDecision: {
        label: "L",
        note: "private fit note",
      } as Product["digboxSizeDecision"],
      factsReviewedBy: "private-reviewer",
      imageEmbedding: [1, 2],
    });
    const result = JSON.stringify(publicProfileProduct(value));
    expect(result).not.toMatch(
      /private|closetSelected|digboxSizeDecision|ReviewedBy|imageEmbedding/
    );
    expect(publicProfileProduct(value).id).toBe("1");
    expect(value.closetSelectedSizeLabel).toBe("L");
  });
  it("has no fabricated analysis when there are no analyzed items", () => {
    expect(describeTasteCollection([item("1")])).toBeNull();
  });
  it("renders the existing interpretation in the requested locale without a browser global", () => {
    const products = [
      item("1", {
        styleAxes: {
          formality: 4,
          refinement: 6,
          technicality: 1,
          historical_orientation: 4,
          visual_boldness: 1,
          affective_softness: 3,
          unconventionality: 1,
          sensuality: 1,
        },
      }),
    ];
    const summary = computeTasteSummary(products);
    expect(
      describeTasteCollection(products, summary, "en")?.summary
    ).not.toMatch(/[가-힣]/);
    expect(describeTasteCollection(products, summary, "ko")?.summary).toMatch(
      /[가-힣]/
    );
  });
});
