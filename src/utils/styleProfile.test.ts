import { describe, expect, it } from "vitest";
import { STYLE_PROTOTYPE_CENTERS } from "../constants/styleAnalysis.js";
import type { Product, StyleAxes } from "../types";
import {
  calculateStyleProfile,
  getEffectiveStyleAxes,
  getProductStyleProfile,
  normalizeStyleAxes,
} from "./styleProfile";

const axes = (value: Record<string, number>) => value as StyleAxes;
const product = (overrides: Partial<Product>) => ({ id: "test", ...overrides }) as Product;

describe("style profile from fixed centres", () => {
  it("accepts only complete 1–7 eight-axis coordinates", () => {
    expect(normalizeStyleAxes(STYLE_PROTOTYPE_CENTERS[0].axes)).toEqual(STYLE_PROTOTYPE_CENTERS[0].axes);
    expect(normalizeStyleAxes({ formality: 4 })).toBeNull();
    expect(normalizeStyleAxes({ ...STYLE_PROTOTYPE_CENTERS[0].axes, sensuality: 8 })).toBeNull();
  });

  it("uses reviewed human axes before AI axes", () => {
    const result = getEffectiveStyleAxes(product({
      styleAxes: axes(STYLE_PROTOTYPE_CENTERS[0].axes),
      humanStyleAxes: axes(STYLE_PROTOTYPE_CENTERS[1].axes),
      styleAxesReviewedAt: "2026-09-01T00:00:00.000Z",
    }));
    expect(result?.source).toBe("human");
    expect(result?.axes).toEqual(STYLE_PROTOTYPE_CENTERS[1].axes);
  });

  it("places every reference centre at rank one for itself", () => {
    for (const center of STYLE_PROTOTYPE_CENTERS) {
      const profile = calculateStyleProfile(axes(center.axes), "ai");
      expect(profile.entries[0]).toMatchObject({ key: center.key, distance: 0, rank: 1 });
    }
  });

  it("normalizes the display top three to exactly 100", () => {
    const profile = calculateStyleProfile(axes(STYLE_PROTOTYPE_CENTERS[4].axes), "ai");
    expect(profile.displayEntries).toHaveLength(3);
    expect(profile.displayEntries.reduce((sum, entry) => sum + entry.score, 0)).toBe(100);
  });

  it("returns no profile without complete axes", () => {
    expect(getProductStyleProfile(product({ styleAxes: { formality: 4 } as unknown as StyleAxes }))).toBeNull();
  });
});
