import { describe, expect, it } from "vitest";
import { getDisplaySizeTable, normalizeMeasurementLabel } from "./sizeTable";

describe("normalized size-table display headers", () => {
  it("keeps the approved top-size labels without shortening them", () => {
    const table = getDisplaySizeTable({
      id: "top-1",
      brand: "Test",
      name: "Top",
      category: "Top",
      url: "",
      image: "",
      normalizedSizeTable: {
        headers: ["사이즈", "총장", "어깨너비", "가슴단면", "소매길이"],
        rows: [["M", "70", "50", "56", "62"]],
      },
    });
    expect(table?.headers).toEqual([
      "사이즈",
      "총장",
      "어깨너비",
      "가슴단면",
      "소매길이",
    ]);
  });

  it("uses the same safe aliases in the browser", () => {
    expect(normalizeMeasurementLabel("몸통단면")).toBe("가슴");
    expect(normalizeMeasurementLabel("밑단 폭")).toBe("밑단");
    expect(normalizeMeasurementLabel("허리둘레")).toBe("허리둘레");
    expect(normalizeMeasurementLabel("화장")).toBe("화장");
  });

  it("keeps the approved skirt labels without shortening them", () => {
    const table = getDisplaySizeTable({
      id: "skirt-1",
      brand: "Test",
      name: "Skirt",
      category: "DressSkirt",
      url: "",
      image: "",
      normalizedSizeTable: {
        headers: ["사이즈", "총장", "허리단면", "밑단단면"],
        rows: [["S", "45", "32", "50"]],
      },
    });
    expect(table?.headers).toEqual(["사이즈", "총장", "허리단면", "밑단단면"]);
  });
});
