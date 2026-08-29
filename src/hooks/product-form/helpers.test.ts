import { describe, expect, it } from "vitest";
import {
  canRegisterWithoutSizeTable,
  getSubmitValidationError,
} from "./helpers";

const t = (key: string) => key as never;

describe("size-table registration validation", () => {
  it.each(["Shoes", "Bag", "JewelryWatch", "FashionAccessory"])(
    "allows %s products without a size table",
    (category) => {
      expect(canRegisterWithoutSizeTable(category)).toBe(true);
      expect(
        getSubmitValidationError(
          {
            hasBrand: true,
            hasName: true,
            hasCategory: true,
            category,
            hasProductImageCheck: true,
            hasValidatedSizeTable: false,
          },
          t
        )
      ).toBeNull();
    }
  );

  it("continues to require a size table for clothing and unknown categories", () => {
    for (const category of ["Top", "Outer", "Bottom", "DressSkirt", ""]) {
      expect(canRegisterWithoutSizeTable(category)).toBe(false);
      expect(
        getSubmitValidationError(
          {
            hasBrand: true,
            hasName: true,
            hasCategory: Boolean(category),
            category,
            hasProductImageCheck: true,
            hasValidatedSizeTable: false,
          },
          t
        )
      ).toBe(
        category
          ? "addProduct.sizeTableRequired"
          : "addProduct.categoryRequired"
      );
    }
  });
});
