import { describe, expect, it } from "vitest";
import {
  normalizeMeasurementLabel,
  normalizeSizeTableForCategory,
} from "./size-table.js";

describe("category size-table normalization", () => {
  it("normalizes tops while retaining extra measurements", () => {
    expect(
      normalizeSizeTableForCategory("Top", {
        headers: ["사이즈", "기장", "어깨", "가슴", "소매", "암홀"],
        rows: [["M", "70cm", "50", "56", "62", "24"]],
      })
    ).toEqual({
      headers: ["사이즈", "총장", "어깨너비", "가슴단면", "소매길이"],
      rows: [["M", "70", "50", "56", "62"]],
      extra: { headers: ["사이즈", "암홀"], rows: [["M", "24"]] },
    });
  });

  it("maps safe aliases and preserves measurements with a different basis", () => {
    expect(normalizeMeasurementLabel("어깨단면")).toBe("어깨");
    expect(normalizeMeasurementLabel("가슴너비")).toBe("가슴");
    expect(normalizeMeasurementLabel("소매장")).toBe("소매");
    expect(normalizeMeasurementLabel("하단 너비")).toBe("밑단");
    expect(normalizeMeasurementLabel("가슴둘레")).toBe("가슴둘레");
    expect(normalizeMeasurementLabel("화장")).toBe("화장");
  });

  it("uses the skirt structure for DressSkirt tables without upper-body measurements", () => {
    expect(
      normalizeSizeTableForCategory("DressSkirt", {
        headers: ["사이즈", "총장", "허리", "밑단"],
        rows: [["S", "45", "32", "50"]],
      })
    ).toMatchObject({
      headers: ["사이즈", "총장", "허리단면", "밑단단면"],
      rows: [["S", "45", "32", "50"]],
    });
  });

  it("normalizes bottom-specific aliases without conflating front and back rise", () => {
    expect(
      normalizeSizeTableForCategory("Bottom", {
        headers: [
          "사이즈",
          "하의 길이",
          "허리 너비",
          "엉덩이 너비",
          "허벅지 넓이",
          "앞 밑위 길이",
          "하의 밑단 너비",
          "안쪽 다리 길이",
          "뒷밑위",
        ],
        rows: [["M", "101", "35", "60", "32", "34", "23", "76", "42"]],
      })
    ).toEqual({
      headers: [
        "사이즈",
        "총장",
        "허리단면",
        "엉덩이단면",
        "허벅지단면",
        "밑위",
        "밑단단면",
      ],
      rows: [["M", "101", "35", "60", "32", "34", "23"]],
      extra: { headers: ["사이즈", "인심", "뒷밑위"], rows: [["M", "76", "42"]] },
    });
  });
});
