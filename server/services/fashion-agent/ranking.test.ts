import { describe, expect, it } from "vitest";
import { rankingScore, retrieveCandidates, sessionAffinity } from "./ranking";
import { evaluationCases } from "./evaluation";
import { emptyFilters, validatePlan } from "./contracts";
import { matchesFilters } from "./engine";

describe("retrieval and reranking", () => {
  it("unions channels without losing a session-only candidate or duplicating IDs", async () => {
    const rows = await retrieveCandidates(
      [{ formality: 2 }, { formality: 6 }],
      async (target) =>
        target.formality === 2
          ? [{ id: "1" }, { id: "2" }]
          : [{ id: "2" }, { id: "3" }]
    );
    expect(rows.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });
  it("lets session relevance beat slightly stronger long-term affinity", () => {
    const score = (base: number, session: number) =>
      rankingScore({ base, session, novelty: 0, noveltyLevel: "none" });
    expect(score(0.8, 1)).toBeGreaterThan(score(0.9, 0.4));
    expect(
      sessionAffinity(undefined, [{ key: "formality", target: 5 }])
    ).toBeNull();
  });
  it("lets session intent dominate when long-term taste confidence is low", () => {
    const highConfidence = rankingScore({
      base: 1,
      session: 0,
      tasteConfidence: 1,
      novelty: 0,
      noveltyLevel: "none",
    });
    const lowConfidence = rankingScore({
      base: 1,
      session: 0,
      tasteConfidence: 0.1,
      novelty: 0,
      noveltyLevel: "none",
    });
    expect(lowConfidence).toBeLessThan(highConfidence);
  });
  it("never explores outside the collection when asked to select owned items", () => {
    const plan = validatePlan({
      intent: "recommend",
      filters: emptyFilters(),
      personalized: true,
      exploration: true,
      source: "closet",
      productIds: [],
      resultPositions: [],
      reference: null,
      unsupported: [],
      question: null,
      session: {
        candidateScope: "collection",
        novelty: "medium",
        axisPreferences: [],
      },
    });
    expect(plan.exploration).toBe(false);
  });
  it.each(evaluationCases)(
    "$id respects category and color",
    ({ expected }) => {
      const plan = validatePlan({
        intent: "search",
        filters: {
          ...emptyFilters(),
          category: expected.category,
          facts: [{ key: "primary_color", value: expected.color }],
        },
        personalized: false,
        exploration: false,
        source: "digbox",
        productIds: [],
        resultPositions: [],
        reference: null,
        unsupported: [],
        question: null,
      });
      const product = {
        id: "1",
        name: "Example",
        brand: "B",
        image: "",
        url: "",
        category: expected.category,
        styleAttributes: { primary_color: expected.color },
      };
      expect(matchesFilters(product, plan)).toBe(true);
      expect(
        matchesFilters(
          { ...product, styleAttributes: { primary_color: "unknown" } },
          plan
        )
      ).toBe(false);
    }
  );
});
