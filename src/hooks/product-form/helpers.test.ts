import { describe, expect, it } from "vitest";
import {
  canRegisterWithoutSizeTable,
  getSubmitValidationError,
  applyUrlAutofill,
  buildSubmitProductPayload,
} from "./helpers";
import { EMPTY_FORM_DATA } from "../../constants";

describe("URL size table autofill", () => {
  const table = { headers: ["항목", "S", "M"], rows: [["총장", "65", "67"], ["가슴", "50", "52"]] };
  const metadata = { url: "https://example.com/product/1", brand: "Brand", name: "Shirt", sizeExtraction: {
    status: "found" as const, table, source: "dom_table" as const, confidence: "medium" as const, sourceUrl: "https://example.com/product/1",
  } };
  it("fills an empty form with a validated extracted table", () => {
    const result = applyUrlAutofill(EMPTY_FORM_DATA, metadata, "");
    expect(result.extractedTable?.rows).toEqual([["S", "65", "50"], ["M", "67", "52"]]);
  });
  it("preserves user edits and saves them instead of the original extraction", () => {
    const edited = { ...table, rows: [["총장", "66", "68"]] };
    const form = { ...EMPTY_FORM_DATA, extractedTable: edited, rawExtractedTable: table };
    expect(applyUrlAutofill(form, metadata, "").extractedTable).toBe(edited);
    expect(buildSubmitProductPayload(form, null, null).sizeTable).toBe(edited);
  });
  it("does not replace an in-progress manual image extraction", () => {
    const result = applyUrlAutofill({ ...EMPTY_FORM_DATA, sizeChartImage: "data:image/png;base64,test" }, metadata, "");
    expect(result.extractedTable).toBeNull();
  });
});

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
