import { describe, expect, it } from "vitest";
import { STYLE_PROTOTYPE_CENTERS } from "../constants/styleAnalysis.js";
import type { Product, StyleAxes } from "../types";
import { createTasteSignature, presentTasteSignature, tasteSignatureWeight } from "./tasteSignature";

const product = (id: string, center: number, overrides: Partial<Product> = {}) => ({
  id,
  targetGender: "menswear",
  styleAxes: STYLE_PROTOTYPE_CENTERS[center].axes as StyleAxes,
  collectionAddedAt: "2026-09-01T00:00:00.000Z",
  ...overrides,
}) as Product;

describe("taste signature", () => {
  it("requires five valid products", () => {
    expect(createTasteSignature(Array.from({ length: 4 }, (_, index) => product(String(index), 0)), [], Date.parse("2026-09-08T00:00:00.000Z"))).toBeNull();
  });

  it("prioritizes closet items and does not double-count overlap", () => {
    const saved = Array.from({ length: 5 }, (_, index) => product(`saved-${index}`, 0));
    const closet = Array.from({ length: 5 }, (_, index) => product(`closet-${index}`, 6));
    const signature = createTasteSignature(saved, closet, Date.parse("2026-09-08T00:00:00.000Z"));
    expect(signature?.tags[0]).toBe("workwear");
    const overlapping = createTasteSignature(saved, [...closet, ...saved], Date.parse("2026-09-08T00:00:00.000Z"));
    expect(overlapping?.tags[0]).toBe("minimal");
  });

  it("uses reviewed style axes and gives recent items a small boost", () => {
    const reviewed = Array.from({ length: 5 }, (_, index) => product(String(index), 0, {
      humanStyleAxes: STYLE_PROTOTYPE_CENTERS[6].axes as StyleAxes,
      styleAxesReviewedAt: "2026-09-01T00:00:00.000Z",
    }));
    expect(createTasteSignature(reviewed, [], Date.parse("2026-09-08T00:00:00.000Z"))?.tags[0]).toBe("workwear");

    const referenceTime = Date.parse("2026-09-08T00:00:00.000Z");
    expect(tasteSignatureWeight(product("recent", 6), 1, referenceTime)).toBe(1.25);
    expect(tasteSignatureWeight(product("old", 0, { collectionAddedAt: "2026-01-01T00:00:00.000Z" }), 1, referenceTime)).toBe(1);
  });

  it("returns only bounded aggregate fields", () => {
    const signature = createTasteSignature(Array.from({ length: 5 }, (_, index) => product(String(index), 0, { brand: "Private", name: "Private item" })), [], Date.parse("2026-09-08T00:00:00.000Z"));
    expect(signature?.tags.length).toBeLessThanOrEqual(3);
    expect(signature?.axes.length).toBeLessThanOrEqual(2);
    expect(signature?.details.length).toBeLessThanOrEqual(3);
    expect(JSON.stringify(signature)).not.toMatch(/Private|item|count|product/i);
  });

  it("turns the leading tags into a scannable style headline", () => {
    const signature = createTasteSignature(
      Array.from({ length: 5 }, (_, index) => product(String(index), 6)),
      [],
      Date.parse("2026-09-08T00:00:00.000Z"),
    );
    expect(signature).not.toBeNull();
    expect(presentTasteSignature(signature!, "ko").title).toMatch(/^워크웨어 베이스 · .+ 무드$/);
  });
});
