import { describe, expect, it } from "vitest";
import { STYLE_PROTOTYPE_CENTERS } from "../constants/styleAnalysis.js";
import type { Product, StyleAxes } from "../types";
import {
  compareTasteCollections,
  computeTasteShift,
  TASTE_COMPARISON_MIN_PRODUCTS,
  TASTE_SHIFT_MIN_PRODUCTS,
} from "./tasteGraph";

const product = (id: string, centerIndex: number, dayOffset: number): Product =>
  ({
    id,
    targetGender: "menswear",
    styleAxes: STYLE_PROTOTYPE_CENTERS[centerIndex].axes as StyleAxes,
    collectionAddedAt: new Date(Date.UTC(2026, 0, 1 + dayOffset)).toISOString(),
  }) as Product;

describe("taste report confidence rules", () => {
  it("keeps a shift as an early signal until a stable sample exists", () => {
    const products = Array.from(
      { length: TASTE_SHIFT_MIN_PRODUCTS - 1 },
      (_, index) => product(String(index), 0, index + 1)
    );
    const shift = computeTasteShift(products, "digbox");

    expect(shift.confidence).toBe("early");
    expect(shift.primary).toBeNull();
  });

  it("moves the recent profile toward a newly repeated style while retaining older history long-term", () => {
    const products = [
      ...Array.from({ length: 8 }, (_, index) =>
        product(`old-${index}`, 0, index * 7)
      ),
      ...Array.from({ length: 4 }, (_, index) =>
        product(`new-${index}`, 6, 180 + index * 3)
      ),
    ];
    const shift = computeTasteShift(products, "digbox");

    expect(shift.confidence).toBe("established");
    const longTermWorkwear =
      shift.longTerm.entries.find((entry) => entry.tag === "workwear")
        ?.percent || 0;
    const recentWorkwear =
      shift.recent.entries.find((entry) => entry.tag === "workwear")?.percent ||
      0;
    const longTermMinimal =
      shift.longTerm.entries.find((entry) => entry.tag === "minimal")
        ?.percent || 0;
    const recentMinimal =
      shift.recent.entries.find((entry) => entry.tag === "minimal")?.percent ||
      0;
    expect(recentWorkwear).toBeGreaterThan(longTermWorkwear);
    expect(longTermMinimal).toBeGreaterThan(recentMinimal);
    expect(shift.primary).not.toBeNull();
    expect(recentWorkwear - longTermWorkwear).toBeGreaterThan(8);
  });

  it("does not create a change when all saves happened at the same time", () => {
    const products = Array.from(
      { length: TASTE_SHIFT_MIN_PRODUCTS },
      (_, index) => product(String(index), index % 2 === 0 ? 0 : 6, 0)
    );
    const shift = computeTasteShift(products, "digbox");

    expect(shift.direction).toBe("steady");
    expect(shift.primary).toBeNull();
    expect(shift.longTerm.entries).toEqual(shift.recent.entries);
  });

  it("ignores products without a valid collection timestamp", () => {
    const products = Array.from(
      { length: TASTE_SHIFT_MIN_PRODUCTS },
      (_, index) => product(String(index), 0, index)
    );
    products[0] = { ...products[0], collectionAddedAt: null };
    const shift = computeTasteShift(products, "digbox");

    expect(shift.eligibleCount).toBe(TASTE_SHIFT_MIN_PRODUCTS - 1);
    expect(shift.confidence).toBe("early");
  });

  it("does not make saved-versus-closet claims from a small collection", () => {
    const saved = Array.from(
      { length: TASTE_COMPARISON_MIN_PRODUCTS - 1 },
      (_, index) => product(`s${index}`, 1, index + 1)
    );
    const closet = Array.from(
      { length: TASTE_COMPARISON_MIN_PRODUCTS },
      (_, index) => product(`c${index}`, 6, index + 1)
    );
    const comparison = compareTasteCollections(closet, saved);

    expect(comparison.aspirations).toHaveLength(0);
    expect(comparison.saturated).toBeNull();
    expect(comparison.shared).toBeNull();
  });
});
