import { describe, expect, it } from "vitest";
import { STYLE_AXIS_FIELDS } from "./styleAnalysis.js";

const expectedKeys = [
  "formality", "refinement", "technicality", "historical_orientation",
  "visual_boldness", "affective_softness", "unconventionality", "sensuality",
];

describe("semantic style axis definition", () => {
  it("defines exactly eight 1–7 semantic differential axes", () => {
    expect(STYLE_AXIS_FIELDS.map((field) => field.key)).toEqual(expectedKeys);
    for (const field of STYLE_AXIS_FIELDS) {
      expect(field.options.map((option: { value: string }) => option.value)).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
      expect(field.startLabel).toBeTruthy();
      expect(field.endLabel).toBeTruthy();
      expect(field.description).toBeTruthy();
      expect(field.anchors).toMatchObject({ 1: expect.any(String), 4: expect.any(String), 7: expect.any(String) });
      expect(field.caution).toBeTruthy();
    }
  });
});
