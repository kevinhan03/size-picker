import { describe, expect, it } from "vitest";
import {
  detectStyleAttributeConflicts,
  explicitNameColor,
} from "./style-attribute-conflicts.js";

describe("style attribute conflicts", () => {
  it("flags a single explicit color that differs from AI analysis", () => {
    expect(
      detectStyleAttributeConflicts(
        { name: "더블 레이어드 니트 네이비" },
        { primary_color: "black" }
      )
    ).toMatchObject([
      { field: "primary_color", expected: "navy", actual: "black" },
    ]);
  });

  it("does not mistake 블루종 for blue or judge multi-color names", () => {
    expect(explicitNameColor("발수 집업 블루종")).toBeNull();
    expect(explicitNameColor("CREAM/NAVY 스니커즈")).toBeNull();
  });

  it("does not flag matching or missing facts", () => {
    expect(
      detectStyleAttributeConflicts(
        { name: "블랙 셔츠" },
        { primary_color: "black" }
      )
    ).toEqual([]);
    expect(detectStyleAttributeConflicts({ name: "블랙 셔츠" }, {})).toEqual(
      []
    );
  });
});
