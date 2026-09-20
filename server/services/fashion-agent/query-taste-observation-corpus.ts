import type { AgentFilters, AgentPlan } from "../../../src/types/fashion-agent";

export type QueryTasteCorpusCase = {
  id: string;
  question: string;
  plan: AgentPlan;
  kind: "broad" | "directional";
};
const filters = (overrides: Partial<AgentFilters> = {}): AgentFilters => ({
  category: null,
  subCategory: null,
  brand: null,
  keywords: [],
  facts: [],
  axes: [],
  preferredStyles: [],
  avoidedStyles: [],
  targetGender: null,
  ...overrides,
});
const plan = (overrides: Partial<AgentPlan> = {}): AgentPlan => ({
  intent: "recommend",
  filters: filters(),
  personalized: true,
  exploration: false,
  source: "digbox",
  productIds: [],
  resultPositions: [],
  reference: null,
  unsupported: [],
  question: null,
  session: { candidateScope: "catalog", novelty: "none", axisPreferences: [] },
  ...overrides,
});
const categories = [
  ["top", "상의", "Top"],
  ["bottom", "바지", "Bottom"],
  ["outer", "아우터", "Outer"],
  ["shoes", "신발", "Shoes"],
] as const;
const broad = [
  ...categories.flatMap(([id, label, category]) => [
    {
      id: `${id}-general`,
      question: `내 취향에 맞는 ${label}를 추천해줘`,
      plan: plan({ filters: filters({ category }) }),
    },
    {
      id: `${id}-catalog`,
      question: `전체 DB에서 내 취향에 맞는 ${label}를 찾아줘`,
      plan: plan({ intent: "search", filters: filters({ category }) }),
    },
    {
      id: `${id}-familiar`,
      question: `평소 취향과 크게 다르지 않은 ${label}를 추천해줘`,
      plan: plan({ filters: filters({ category }) }),
    },
    {
      id: `${id}-new`,
      question: `평소 취향에서 크게 벗어나지 않는 새로운 ${label}를 추천해줘`,
      plan: plan({
        exploration: true,
        filters: filters({ category }),
        session: {
          candidateScope: "catalog",
          novelty: "medium",
          axisPreferences: [],
        },
      }),
    },
  ]),
  {
    id: "general-any",
    question: "내 취향에 맞는 새로운 상품을 추천해줘",
    plan: plan({
      exploration: true,
      session: {
        candidateScope: "catalog",
        novelty: "medium",
        axisPreferences: [],
      },
    }),
  },
  {
    id: "general-catalog",
    question: "전체 DB에서 내 취향에 맞는 상품을 찾아줘",
    plan: plan({ intent: "search" }),
  },
  {
    id: "general-closet",
    question: "저장한 상품 취향을 바탕으로 추천해줘",
    plan: plan(),
  },
  {
    id: "general-variation",
    question: "내 취향에서 자연스럽게 고를 만한 상품을 추천해줘",
    plan: plan(),
  },
];
const directional = [
  ...categories.flatMap(([id, label, category]) =>
    [
      ["formal", `평소보다 조금 더 포멀한 ${label}를 추천해줘`, "formality", 5],
      [
        "less-technical",
        `너무 기능적인 느낌은 아닌 ${label}를 추천해줘`,
        "technicality",
        2,
      ],
      ["refined", `더 정돈된 인상의 ${label}를 추천해줘`, "refinement", 6],
      [
        "bold",
        `내 취향은 유지하면서 존재감은 조금 더 있는 ${label}를 추천해줘`,
        "visual_boldness",
        5,
      ],
      [
        "soft",
        `부드러운 분위기의 ${label}를 추천해줘`,
        "affective_softness",
        6,
      ],
    ].map(([suffix, question, key, target]) => ({
      id: `${id}-${suffix}`,
      question: question as string,
      plan: plan({
        filters: filters({ category }),
        session: {
          candidateScope: "catalog",
          novelty: "none",
          axisPreferences: [{ key: key as string, target: target as number }],
        },
      }),
    }))
  ),
  {
    id: "minimal-top",
    question: "미니멀한 무드의 상의를 추천해줘",
    plan: plan({
      filters: filters({ category: "Top", preferredStyles: ["minimal"] }),
    }),
  },
  {
    id: "classic-outer",
    question: "클래식한 무드의 아우터를 추천해줘",
    plan: plan({
      filters: filters({ category: "Outer", preferredStyles: ["classic"] }),
    }),
  },
  {
    id: "workwear-bottom",
    question: "워크웨어 무드의 바지를 추천해줘",
    plan: plan({
      filters: filters({ category: "Bottom", preferredStyles: ["workwear"] }),
    }),
  },
  {
    id: "wide-bottom",
    question: "와이드 실루엣의 바지를 추천해줘",
    plan: plan({
      filters: filters({
        category: "Bottom",
        facts: [{ key: "silhouette", value: "wide" }],
      }),
    }),
  },
  {
    id: "black-shoes",
    question: "검정 신발을 내 취향에 맞게 추천해줘",
    plan: plan({
      filters: filters({
        category: "Shoes",
        facts: [{ key: "primary_color", value: "black" }],
      }),
    }),
  },
  {
    id: "street-top",
    question: "스트릿 무드의 상의를 추천해줘",
    plan: plan({
      filters: filters({ category: "Top", preferredStyles: ["street"] }),
    }),
  },
  {
    id: "vintage-outer",
    question: "빈티지 무드의 아우터를 추천해줘",
    plan: plan({
      filters: filters({ category: "Outer", preferredStyles: ["vintage"] }),
    }),
  },
  {
    id: "leather-shoes",
    question: "가죽 느낌의 신발을 추천해줘",
    plan: plan({
      filters: filters({
        category: "Shoes",
        facts: [{ key: "primary_material", value: "leather" }],
      }),
    }),
  },
  {
    id: "navy-outer",
    question: "네이비 아우터를 내 취향에 맞게 추천해줘",
    plan: plan({
      filters: filters({
        category: "Outer",
        facts: [{ key: "primary_color", value: "navy" }],
      }),
    }),
  },
  {
    id: "brown-bottom",
    question: "브라운 계열 바지를 내 취향에 맞게 추천해줘",
    plan: plan({
      filters: filters({
        category: "Bottom",
        facts: [{ key: "primary_color", value: "brown" }],
      }),
    }),
  },
];
export const queryTasteObservationCorpus: QueryTasteCorpusCase[] = [
  ...broad.map((item) => ({ ...item, kind: "broad" as const })),
  ...directional.map((item) => ({ ...item, kind: "directional" as const })),
];
if (queryTasteObservationCorpus.length !== 50)
  throw new Error("query_taste_corpus_must_be_50");
