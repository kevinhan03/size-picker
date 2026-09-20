import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentPlan, AgentState } from "../../../src/types/fashion-agent";
import { emptyFilters } from "./contracts";
vi.mock("./openai", () => ({ structuredResponse: vi.fn() }));
vi.mock("./engine", () => ({ runEngine: vi.fn() }));
vi.mock("../user-collections", () => ({
  getClosetProducts: vi.fn(),
  getDigboxProducts: vi.fn(),
}));
import { structuredResponse } from "./openai";
import { runEngine } from "./engine";
import { getClosetProducts, getDigboxProducts } from "../user-collections";
import { runAgent, mergeTurnPlan } from "./agent";
const plan = (): AgentPlan => ({
  intent: "search",
  filters: emptyFilters(),
  personalized: false,
  exploration: false,
  source: "digbox",
  productIds: [],
  resultPositions: [],
  reference: null,
  unsupported: [],
  question: null,
});
const state: AgentState = { plan: plan(), resultIds: ["12", "34"] };
beforeEach(() => vi.resetAllMocks());
describe("bounded agent orchestration", () => {
  it("removes turn metadata before strict plan validation", async () => {
    vi.mocked(structuredResponse).mockResolvedValue({
      ...plan(),
      turnUpdate: {
        mode: "new",
        changedFilters: [],
        changedSession: [],
        changedContext: [],
      },
    });
    vi.mocked(runEngine).mockResolvedValue({
      text: "Found",
      products: [],
      notes: [],
    });
    await expect(
      runAgent("actor", "상의 찾아줘", state, [], "ko")
    ).resolves.toBeDefined();
  });
  it("preserves untouched conditions while applying explicit removals", () => {
    const previous = {
      ...plan(),
      filters: {
        ...emptyFilters(),
        category: "Top",
        brand: "Brand",
        facts: [{ key: "primary_color", value: "black" }],
      },
    };
    const merged = mergeTurnPlan(plan(), previous, {
      mode: "refine",
      changedFilters: ["brand"],
      changedSession: [],
    });
    expect(merged.filters.brand).toBeNull();
    expect(merged.filters.category).toBe("Top");
    expect(merged.filters.facts).toEqual(previous.filters.facts);
    expect(previous.filters.brand).toBe("Brand");
  });
  it("resets conditions for independent searches", () => {
    const previous = {
      ...plan(),
      filters: { ...emptyFilters(), brand: "Brand" },
    };
    expect(
      mergeTurnPlan(plan(), previous, {
        mode: "new",
        changedFilters: [],
        changedSession: [],
      }).filters.brand
    ).toBeNull();
  });
  it("normalizes an explicit pairing request with a distinct reference", async () => {
    vi.mocked(structuredResponse).mockResolvedValue({
      ...plan(),
      intent: "recommend",
      filters: { ...emptyFilters(), category: "Top" },
      reference: {
        source: "closet",
        filters: { ...emptyFilters(), category: "Bottom", brand: "DIVEIN" },
      },
    });
    const result = await import("./agent").then(({ interpretAgentPlan }) =>
      interpretAgentPlan(
        "내가 가진 다이브인 바지와 어울리는 상의",
        { plan: null, resultIds: [] },
        [],
        "ko"
      )
    );
    expect(result.intent).toBe("compatible");
  });
  it("binds a dependent pairing to the new first result, preserving displayed ordinals", async () => {
    vi.mocked(structuredResponse).mockResolvedValue({
      ...plan(),
      intent: "recommend",
      followUp: {
        filters: { ...emptyFilters(), category: "Bottom" },
        candidateScope: "catalog",
      },
    });
    const card = (id: string) => ({
      id,
      name: id,
      brand: "B",
      category: "Outer",
      image: "",
      url: "",
      reasons: [],
      tasteScore: null,
    });
    vi.mocked(runEngine)
      .mockResolvedValueOnce({
        text: "First",
        products: [card("101"), card("102")],
        notes: [],
      })
      .mockResolvedValueOnce({
        text: "Pair",
        products: [card("201")],
        notes: [],
      });
    const result = await runAgent(
      "actor",
      "아우터 추천하고 첫 추천과 어울리는 바지도",
      state,
      [],
      "ko"
    );
    expect(runEngine).toHaveBeenNthCalledWith(
      2,
      "actor",
      expect.objectContaining({
        intent: "compatible",
        followUp: null,
        filters: expect.objectContaining({ category: "Bottom" }),
      }),
      ["101"],
      "ko"
    );
    expect(result.state.resultIds).toEqual(["101", "102", "201"]);
  });
  it("does not run a dependent search when the first stage has no result", async () => {
    vi.mocked(structuredResponse).mockResolvedValue({
      ...plan(),
      followUp: {
        filters: { ...emptyFilters(), category: "Bottom" },
        candidateScope: "catalog",
      },
    });
    vi.mocked(runEngine).mockResolvedValue({
      text: "No results",
      products: [],
      notes: [],
    });
    await runAgent("actor", "아우터와 그에 맞는 바지", state, [], "ko");
    expect(runEngine).toHaveBeenCalledTimes(1);
  });
  it("passes only the authenticated actor and resolved product IDs to the engine", async () => {
    vi.mocked(structuredResponse).mockResolvedValue({
      ...plan(),
      intent: "compatible",
      resultPositions: [2],
    });
    vi.mocked(runEngine).mockResolvedValue({
      text: "Found",
      products: [],
      notes: [],
    });
    const result = await runAgent(
      "authenticated-user",
      "두번째 상품",
      state,
      [],
      "ko"
    );
    expect(runEngine).toHaveBeenCalledWith(
      "authenticated-user",
      expect.any(Object),
      ["34"],
      "ko"
    );
    expect(result.state.resultIds).toEqual(["12", "34"]);
  });
  it("never runs the engine with fabricated product references", async () => {
    vi.mocked(structuredResponse).mockResolvedValue({
      ...plan(),
      intent: "similar",
      productIds: ["999"],
    });
    const result = await runAgent(
      "actor",
      "이거와 비슷한 상품",
      state,
      [],
      "ko"
    );
    expect(runEngine).not.toHaveBeenCalled();
    expect(result.reply.products).toEqual([]);
    expect(result.state).toEqual(state);
  });
  it("preserves the last displayed card order after an informational question", async () => {
    vi.mocked(structuredResponse)
      .mockResolvedValueOnce({ ...plan(), intent: "knowledge" })
      .mockResolvedValueOnce({ text: "Fashion definition" });
    const result = await runAgent("actor", "드리즐러가 뭐야", state, [], "ko");
    expect(result.state).toEqual(state);
    expect(runEngine).not.toHaveBeenCalled();
    expect(result.reply.notes[0]).toContain("일반 패션 지식");
  });
  it("keeps product ranking and evidence from the engine, not the model", async () => {
    vi.mocked(structuredResponse).mockResolvedValue(plan());
    const reply = {
      text: "Evidence",
      products: [
        {
          id: "56",
          brand: "B",
          name: "N",
          image: "",
          url: "",
          category: "Top",
          tasteScore: 80,
          reasons: ["Actual evidence"],
        },
      ],
      notes: [],
    };
    vi.mocked(runEngine).mockResolvedValue(reply);
    const result = await runAgent("actor", "셔츠", state, [], "ko");
    expect(result.reply).toEqual(reply);
    expect(result.state.resultIds).toEqual(["56"]);
    expect(structuredResponse).toHaveBeenCalledTimes(1);
  });
  it("asks for two identified products before comparing", async () => {
    vi.mocked(structuredResponse).mockResolvedValue({
      ...plan(),
      intent: "compare",
    });
    await runAgent("actor", "A랑 B 비교", state, [], "ko");
    expect(runEngine).not.toHaveBeenCalled();
  });
  it("uses one naturally described wardrobe item as a compatible-product reference", async () => {
    vi.mocked(structuredResponse).mockResolvedValue({
      ...plan(),
      intent: "compatible",
      filters: { ...emptyFilters(), category: "Top" },
      reference: {
        source: "closet",
        filters: {
          ...emptyFilters(),
          category: "Bottom",
          keywords: ["cargo"],
        },
      },
    });
    vi.mocked(getClosetProducts).mockResolvedValue([
      {
        id: "closet-pants",
        brand: "Brand",
        name: "Cargo pants",
        category: "Bottom",
        image: "",
        url: "",
      },
    ]);
    vi.mocked(runEngine).mockResolvedValue({
      text: "Found",
      products: [],
      notes: [],
    });
    await runAgent(
      "actor",
      "내가 가진 카고팬츠와 어울리는 상의",
      { plan: null, resultIds: [] },
      [],
      "ko"
    );
    expect(runEngine).toHaveBeenCalledWith(
      "actor",
      expect.any(Object),
      ["closet-pants"],
      "ko"
    );
  });
  it("treats a saved-product category as taste context, not a missing reference", async () => {
    vi.mocked(structuredResponse).mockResolvedValue({
      ...plan(),
      intent: "recommend",
      personalized: true,
      exploration: true,
      source: "digbox",
      filters: { ...emptyFilters(), category: "Outer" },
      reference: {
        source: "digbox",
        filters: { ...emptyFilters(), category: "Outer" },
      },
    });
    vi.mocked(runEngine).mockResolvedValue({
      text: "Found",
      products: [],
      notes: [],
    });
    await runAgent(
      "actor",
      "저장한 아우터 중 내 취향에 맞는 새로운 제품을 찾아줘",
      { plan: null, resultIds: [] },
      [],
      "ko"
    );
    expect(getDigboxProducts).not.toHaveBeenCalled();
    expect(runEngine).toHaveBeenCalledWith(
      "actor",
      expect.any(Object),
      [],
      "ko"
    );
  });
});
