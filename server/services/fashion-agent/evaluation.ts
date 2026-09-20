/** Synthetic regression corpus, not a claim of human-rated recommendation quality. */
export const evaluationCases = [
  ...["검정", "흰색", "회색", "파란색", "갈색"].flatMap((color, c) =>
    ["상의", "바지", "아우터", "신발"].flatMap((category, k) =>
      [
        "찾아줘",
        "추천해줘",
        "전체 DB에서 찾아줘",
        "내 취향에 맞게 찾아줘",
        "새로운 제품으로 추천해줘",
      ].map((suffix, s) => ({
        id: `filter-${c}-${k}-${s}`,
        question: `${color} ${category} ${suffix}`,
        expected: {
          category: ["Top", "Bottom", "Outer", "Shoes"][k],
          color: ["black", "white", "gray", "blue", "brown"][c],
        },
      }))
    )
  ),
];

export const conversationCases = [
  {
    question: "옷장에 저장한 아우터 중에서 골라줘",
    expected: "collection scope, closet source, no single reference",
  },
  {
    question: "옷장 취향을 바탕으로 전체 DB에서 새로운 아우터 찾아줘",
    expected: "catalog scope, closet source, novelty medium",
  },
  {
    question: "너무 기능적인 느낌은 아닌 아우터",
    expected: "technicality soft preference, no literal keyword",
  },
  {
    question: "첫 추천 아우터와 어울리는 바지도 같이 찾아줘",
    expected:
      "two-stage plan when a new initial recommendation is requested; never invent a prior reference",
  },
  {
    question: "20만원 이하 니트",
    expected: "unsupported price; no fabricated price",
  },
  {
    question: "평소보다 조금 더 포멀하게",
    expected: "session preference; preserve prior category",
  },
  {
    question: "두 번째 상품과 어울리는 바지",
    expected: "previous result position 2, Bottom category",
  },
  {
    question: "다이버인 카키 카고팬츠와 어울리는 상의",
    expected: "distinct reference lookup, Top results",
  },
];
