import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentPlan } from "../../../src/types/fashion-agent";
import { emptyFilters } from "./contracts";

const mocks = vi.hoisted(() => ({
  closet: vi.fn(),
  engine: vi.fn(),
  select: vi.fn(),
  in: vi.fn(),
}));
vi.mock("../user-collections", () => ({ getClosetProducts: mocks.closet }));
vi.mock("./engine", () => ({ runEngine: mocks.engine }));
vi.mock("../../lib/supabase.js", () => ({
  supabase: { from: () => ({ select: mocks.select }) },
}));
vi.mock("../catalog", () => ({
  RECOMMENDATION_COLUMNS: "id,category,name,brand",
  normalizeAnalysisProduct: (row: unknown) => row,
}));
vi.mock("../../../src/utils/tasteGraph", () => ({
  getEffectiveProductTargetGender: () => "unisex",
  getCrossCategoryStyleSimilarity: () => ({ score: 0.8 }),
}));
import { buildOutfit } from "./outfit";

const plan: AgentPlan = {
  intent: "wardrobe",
  filters: emptyFilters(),
  personalized: true,
  exploration: false,
  source: "closet",
  productIds: [],
  resultPositions: [],
  reference: null,
  unsupported: [],
  question: null,
};
const card = (id: string, category: string) => ({
  id,
  category,
  name: category,
  brand: "Test",
  image: "",
  reasons: [],
  tasteScore: null,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.closet.mockResolvedValue([]);
  mocks.select.mockReturnValue({ in: mocks.in });
  mocks.in.mockImplementation(async (_: string, ids: string[]) => ({
    data: ids.map((id) => ({
      id,
      category: (
        { "1": "Top", "2": "Bottom", "3": "Outer", "4": "Shoes" } as Record<
          string,
          string
        >
      )[id],
      name: id,
      brand: "Test",
    })),
    error: null,
  }));
  mocks.engine.mockImplementation(async (_: string, p: AgentPlan) => ({
    products: [
      card(
        String(
          ["Top", "Bottom", "Outer", "Shoes"].indexOf(p.filters.category!) + 1
        ),
        p.filters.category!
      ),
    ],
  }));
});

describe("outfit assembly", () => {
  it("fills an empty wardrobe from the catalog and records each source", async () => {
    const result = await buildOutfit("user", plan, "ko");
    expect(result.outfit?.slots.map((slot) => slot.source)).toEqual([
      "catalog",
      "catalog",
      "catalog",
      "catalog",
    ]);
    expect(result.products).toHaveLength(4);
  });
  it("uses owned items first and reports a missing slot", async () => {
    mocks.closet.mockResolvedValue([
      { id: "10", category: "Top", name: "Owned top", brand: "Test" },
    ]);
    mocks.engine.mockImplementation(async (_: string, p: AgentPlan) => ({
      products:
        p.filters.category === "Shoes"
          ? []
          : [
              card(
                String(
                  ["Top", "Bottom", "Outer", "Shoes"].indexOf(
                    p.filters.category!
                  ) + 1
                ),
                p.filters.category!
              ),
            ],
    }));
    const result = await buildOutfit("user", plan, "ko");
    expect(result.outfit?.slots.map((slot) => slot.source)).toEqual([
      "closet",
      "catalog",
      "catalog",
      null,
    ]);
    expect(result.products).toHaveLength(3);
  });
});
