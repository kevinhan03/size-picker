import type { AgentFilters, AgentPlan } from "../../../src/types/fashion-agent";

export type EvaluationQuestion = {
  id: string;
  question: string;
  plan: AgentPlan;
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
const plan = (overrides: Partial<AgentPlan>): AgentPlan => ({
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
const colors = [
  ["black", "검정"],
  ["white", "흰색"],
  ["gray", "회색"],
  ["brown", "브라운"],
  ["navy", "네이비"],
] as const;

export const evaluationQuestions: EvaluationQuestion[] = [
  ...categories.flatMap(([slug, ko, category]) =>
    colors.map(([value, label]) => ({
      id: `colour-${slug}-${value}`,
      question: `내 취향에 맞는 ${label} ${ko}를 추천해줘`,
      plan: plan({
        filters: filters({
          category,
          facts: [{ key: "primary_color", value }],
        }),
      }),
    }))
  ),
  ...categories.flatMap(([slug, ko, category]) =>
    [
      [
        "less-technical",
        `너무 기능적인 느낌은 아닌 ${ko}를 내 취향에 맞게 추천해줘`,
        "technicality",
        2,
      ],
      [
        "more-formal",
        `평소 취향보다 조금 더 포멀한 ${ko}를 추천해줘`,
        "formality",
        5,
      ],
      [
        "more-bold",
        `내 취향은 유지하면서 존재감은 조금 더 있는 ${ko}를 추천해줘`,
        "visual_boldness",
        5,
      ],
      [
        "less-bold",
        `내 취향에 맞되 너무 튀지 않는 ${ko}를 추천해줘`,
        "visual_boldness",
        3,
      ],
    ].map(([suffix, question, key, target]) => ({
      id: `${slug}-${suffix}`,
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
  ...[
    [
      "wide-bottom",
      "내 취향에 맞는 와이드 팬츠를 추천해줘",
      "Bottom",
      "silhouette",
      "wide",
    ],
    [
      "leather-shoes",
      "내 취향에 맞는 가죽 느낌의 신발을 추천해줘",
      "Shoes",
      "primary_material",
      "leather",
    ],
    [
      "minimal-top",
      "미니멀한 무드의 상의를 내 취향에 맞게 추천해줘",
      "Top",
      "style_tags",
      "minimal",
    ],
    [
      "classic-outer",
      "클래식한 무드의 아우터를 내 취향에 맞게 추천해줘",
      "Outer",
      "style_tags",
      "classic",
    ],
    [
      "dark-new-outer",
      "어두운 무드의 새로운 아우터를 추천해줘",
      "Outer",
      "primary_color",
      "black",
    ],
    [
      "soft-top",
      "부드러운 분위기의 상의를 내 취향에 맞게 추천해줘",
      "Top",
      "style_tags",
      "lovely",
    ],
    [
      "heritage-bottom",
      "헤리티지 느낌의 바지를 추천해줘",
      "Bottom",
      "style_tags",
      "vintage",
    ],
    [
      "modern-shoes",
      "정돈된 현대적 분위기의 신발을 추천해줘",
      "Shoes",
      "style_tags",
      "chic_modern",
    ],
    [
      "street-top",
      "스트릿 무드이지만 내 취향에 맞는 상의를 추천해줘",
      "Top",
      "style_tags",
      "street",
    ],
    [
      "new-bottom",
      "평소와 너무 멀지 않은 새로운 바지를 추천해줘",
      "Bottom",
      "silhouette",
      "straight",
    ],
    [
      "gray-outer",
      "차분한 회색 아우터를 내 취향에 맞게 추천해줘",
      "Outer",
      "primary_color",
      "gray",
    ],
    [
      "refined-top",
      "정돈된 인상의 상의를 내 취향에 맞게 추천해줘",
      "Top",
      "style_tags",
      "chic_modern",
    ],
    [
      "unconventional-shoes",
      "평소 취향을 유지하면서 조금 독특한 신발을 추천해줘",
      "Shoes",
      "style_tags",
      "sporty",
    ],
    [
      "workwear-bottom",
      "워크웨어 느낌의 바지를 내 취향에 맞게 추천해줘",
      "Bottom",
      "style_tags",
      "workwear",
    ],
  ].map(([id, question, category, key, value]) => ({
    id: id as string,
    question: question as string,
    plan: plan({
      exploration: id === "dark-new-outer" || id === "new-bottom",
      filters: filters({
        category: category as string,
        facts:
          key === "style_tags"
            ? []
            : [{ key: key as string, value: value as string }],
        preferredStyles: key === "style_tags" ? [value as string] : [],
      }),
      session: {
        candidateScope: "catalog",
        novelty:
          id === "dark-new-outer" || id === "new-bottom" ? "medium" : "none",
        axisPreferences: [],
      },
    }),
  })),
];

if (evaluationQuestions.length !== 50)
  throw new Error("evaluation_question_count_must_be_50");
