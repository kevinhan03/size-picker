import { describe, expect, it } from "vitest";
import {
  getKoreanShoeSizeTable,
  isNonApparelSizeCategory,
  isShoeCategory,
  KOREAN_SHOE_SIZE_OPTIONS,
} from "./shoeSize";

describe("Korean shoe sizes", () => {
  it("offers 220mm through 300mm in 5mm steps", () => {
    expect(KOREAN_SHOE_SIZE_OPTIONS).toEqual([
      "220",
      "225",
      "230",
      "235",
      "240",
      "245",
      "250",
      "255",
      "260",
      "265",
      "270",
      "275",
      "280",
      "285",
      "290",
      "295",
      "300",
    ]);
    expect(getKoreanShoeSizeTable()).toEqual({
      headers: ["사이즈"],
      rows: KOREAN_SHOE_SIZE_OPTIONS.map((size) => [size]),
    });
  });

  it("only treats the Shoes category as footwear", () => {
    expect(isShoeCategory("Shoes")).toBe(true);
    expect(isShoeCategory("Bag")).toBe(false);
  });

  it("marks non-apparel categories as not needing size tables", () => {
    expect(isNonApparelSizeCategory("Shoes")).toBe(true);
    expect(isNonApparelSizeCategory("Bag")).toBe(true);
    expect(isNonApparelSizeCategory("JewelryWatch")).toBe(true);
    expect(isNonApparelSizeCategory("FashionAccessory")).toBe(true);
    expect(isNonApparelSizeCategory("Top")).toBe(false);
  });
});
