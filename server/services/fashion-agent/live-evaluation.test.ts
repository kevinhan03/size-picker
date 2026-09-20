import { describe, expect, it } from "vitest";
import { interpretAgentPlan } from "./agent";

// Explicit opt-in: ordinary tests never spend API credits. Only synthetic prompts are sent.
const enabled = process.env.FASHION_AGENT_LIVE_EVAL === "1";
if (enabled) {
  for (const file of [".env.local", ".env"]) {
    try {
      process.loadEnvFile(file);
    } catch {
      /* environment variables may already be provided */
    }
  }
}
describe.skipIf(!enabled)("live intent evaluation", () => {
  it("retains and clears constraints across a real conversation", async () => {
    let state: import("../../../src/types/fashion-agent").AgentState = {
      plan: null,
      resultIds: [],
    };
    const history: import("../../../src/types/fashion-agent").AgentMessage[] =
      [];
    const ask = async (message: string) => {
      const plan = await interpretAgentPlan(message, state, history, "ko");
      state = { ...state, plan };
      history.push({ id: String(history.length), role: "user", text: message });
      return plan;
    };
    const first = await ask("내 취향에 맞는 검정 상의를 추천해줘");
    expect(first.filters.category).toBe("Top");
    expect(first.filters.facts).toContainEqual({
      key: "primary_color",
      value: "black",
    });
    const refined = await ask("좀 더 깔끔하게 보여줘");
    expect(refined.filters.category).toBe("Top");
    expect(refined.filters.facts).toContainEqual({
      key: "primary_color",
      value: "black",
    });
    expect(
      refined.session?.axisPreferences.some(
        (a) => a.key === "refinement" && a.target >= 5
      )
    ).toBe(true);
    const cleared = await ask("색상은 이제 상관없어. 나머지 조건은 그대로");
    expect(cleared.filters.category).toBe("Top");
    expect(cleared.filters.facts.some((f) => f.key === "primary_color")).toBe(
      false
    );
    expect(cleared.personalized).toBe(true);
    const fresh = await ask(
      "새 검색이야. 내 취향 반영하지 말고 파란 바지만 찾아줘"
    );
    expect(fresh.filters.category).toBe("Bottom");
    expect(fresh.personalized).toBe(false);
    expect(fresh.session?.axisPreferences || []).toEqual([]);
  }, 120000);
  const cases = [
    {
      question: "옷장에 저장한 아우터 중에서 골라줘",
      check: (p: Awaited<ReturnType<typeof interpretAgentPlan>>) => {
        expect(p.source).toBe("closet");
        expect(p.session?.candidateScope).toBe("collection");
        expect(p.reference).toBeNull();
        expect(p.filters.category).toBe("Outer");
      },
    },
    {
      question: "옷장 취향을 바탕으로 전체 DB에서 새로운 아우터 찾아줘",
      check: (p: Awaited<ReturnType<typeof interpretAgentPlan>>) => {
        expect(p.source).toBe("closet");
        expect(p.session?.candidateScope).toBe("catalog");
        expect(p.exploration).toBe(true);
      },
    },
    {
      question: "너무 기능적인 느낌은 아닌 아우터 추천해줘",
      check: (p: Awaited<ReturnType<typeof interpretAgentPlan>>) => {
        expect(
          p.session?.axisPreferences.some(
            (a) => a.key === "technicality" && a.target <= 3
          )
        ).toBe(true);
        expect(p.filters.keywords).toEqual([]);
      },
    },
    ...[
      "아웃도어 장비처럼 보이지 않는 아우터를 추천해줘",
      "테크니컬한 분위기는 빼고 아우터를 찾아줘",
      "깔끔하고 단정한 느낌의 아우터를 찾아줘",
      "말끔하게 정돈된 인상의 아우터를 찾아줘",
    ].map((question) => ({
      question,
      check: (p: Awaited<ReturnType<typeof interpretAgentPlan>>) => {
        const technical = /아웃도어|테크니컬/.test(question);
        expect(
          p.session?.axisPreferences.some((axis) =>
            technical
              ? axis.key === "technicality" && axis.target <= 3
              : axis.key === "refinement" && axis.target >= 5
          )
        ).toBe(true);
      },
    })),
    {
      question:
        "내 취향에 맞는 아우터 추천하고 첫 번째 추천과 어울리는 바지도 찾아줘",
      check: (p: Awaited<ReturnType<typeof interpretAgentPlan>>) => {
        expect(p.filters.category).toBe("Outer");
        expect(p.followUp?.filters.category).toBe("Bottom");
        expect(p.resultPositions).toEqual([]);
        expect(p.unsupported).toEqual([]);
      },
    },
    {
      question: "20만원 이하 니트 찾아줘",
      check: (p: Awaited<ReturnType<typeof interpretAgentPlan>>) => {
        expect(p.unsupported.length).toBeGreaterThan(0);
      },
    },
    {
      question:
        "내가 가진 다이브인 카키색 카고팬츠와 어울리는 상의를 전체 DB에서 추천해줘",
      check: (p: Awaited<ReturnType<typeof interpretAgentPlan>>) => {
        expect(p.intent).toBe("compatible");
        expect(p.filters.category).toBe("Top");
        expect(p.reference?.source).toBe("closet");
      },
    },
  ];
  it.each(cases)(
    "$question",
    async ({ question, check }) => {
      const plan = await interpretAgentPlan(
        question,
        { plan: null, resultIds: [] },
        [],
        "ko"
      );
      check(plan);
    },
    35000
  );
});
