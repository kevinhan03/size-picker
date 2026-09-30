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
  it("uses the category-normalized table for URL extraction while retaining its raw table", () => {
    const bottomMetadata = {
      ...metadata,
      sizeExtraction: {
        ...metadata.sizeExtraction,
        table: {
          headers: ["사이즈", "S", "M"],
          rows: [["총장", "100", "102"], ["허리", "36", "38"], ["가슴", "50", "52"]],
        },
      },
    };
    const result = applyUrlAutofill({ ...EMPTY_FORM_DATA, category: "Bottom" }, bottomMetadata, "");
    expect(result.extractedTable?.headers).toEqual(["사이즈", "총장", "허리단면", "엉덩이단면", "허벅지단면", "밑위", "밑단단면"]);
    expect(result.extractedTable?.rows).toEqual([["S", "100", "36", "", "", "", ""], ["M", "102", "38", "", "", "", ""]]);
    expect(result.rawExtractedTable?.headers).toEqual(["사이즈", "총장", "허리", "가슴"]);
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
