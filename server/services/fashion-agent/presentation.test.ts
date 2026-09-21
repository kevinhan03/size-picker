import { describe, expect, it, vi } from "vitest";
vi.mock("../../lib/supabase.js", () => ({ supabase: {} }));
import { discoveryMix, tasteRepresentatives } from "./presentation";
import { agentPalette } from "../../../src/utils/agent-palette";
import type { Product } from "../../../src/types";

describe("recommendation presentation", () => {
  it("keeps relevance order while limiting familiar products to two", () => {
    const products = [
      "saved",
      "owned",
      "saved",
      "new",
      "new",
      "new",
      "new",
      "new",
      "new",
      "new",
    ].map((relationship, id) => ({ id, relationship }));
    expect(
      discoveryMix(products, (p) => p.relationship).map((p) => p.id)
    ).toEqual([0, 1, 3, 4, 5, 6, 7, 8]);
    expect(
      discoveryMix(products.slice(0, 3), (p) => p.relationship)
    ).toHaveLength(2);
  });
  it("keeps palettes stable for an answer and varies across answers", () => {
    expect(agentPalette("answer-12")).toEqual(agentPalette("answer-12"));
    expect(
      new Set(
        Array.from(
          { length: 12 },
          (_, i) => agentPalette(`answer-${i}`).background
        )
      ).size
    ).toBeGreaterThan(3);
  });
  it("does not invent evidence when style analysis is absent", () => {
    const products = [{ id: "1", name: "Item" }] as Product[];
    expect(
      tasteRepresentatives(products, ["minimal"], "ko")[0].products
    ).toEqual([]);
  });
});
