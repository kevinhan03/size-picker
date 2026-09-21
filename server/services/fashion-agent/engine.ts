import type { Product, StyleAxes, StyleProfileKey } from "../../../src/types";
import type {
  AgentPlan,
  AgentProduct,
  AgentReply,
} from "../../../src/types/fashion-agent";
import {
  STYLE_AXIS_FIELDS,
  STYLE_PROTOTYPE_CENTERS,
  STYLE_ATTRIBUTE_FIELDS,
} from "../../../src/constants/styleAnalysis.js";
import {
  getEffectiveStyleAxes,
  getProductStyleProfile,
  styleProfileLabels,
  styleProfileVector,
} from "../../../src/utils/styleProfile";
import {
  computeTasteSummary,
  computeTasteShift,
  getCrossCategoryStyleSimilarity,
  getEffectiveProductTargetGender,
  isOutfitCategoryPair,
} from "../../../src/utils/tasteGraph";
import { supabase } from "../../lib/supabase.js";
import {
  normalizeAnalysisProduct,
  normalizeProductCard,
  RECOMMENDATION_COLUMNS,
} from "../catalog";
import { getTasteSummary } from "../taste-analysis";
import { getProductRecommendationData } from "../product-recommendations";
import { retrieveCandidates, rankingScore, sessionAffinity } from "./ranking";
import { feedbackAdjustment, getFeedbackProfile } from "./feedback";
import { recordShadow } from "../taste-clusters/service";
import { traceEvent } from "./trace";
import { recordQueryTasteObservation } from "./query-taste-observation";
import { computeTasteConfidence } from "./taste-confidence";
import { FASHION_AGENT_ALGORITHM } from "./version";
import {
  candidateRelationships,
  compactCard,
  discoveryMix,
  tasteRepresentatives,
} from "./presentation";

const AXES = STYLE_AXIS_FIELDS.map((f) => f.key) as Array<keyof StyleAxes>;
const axisLabels: Record<string, [string, string]> = {
  formality: ["포멀함", "formality"],
  refinement: ["정돈된 인상", "refinement"],
  technicality: ["기능적인 인상", "technical appearance"],
  historical_orientation: ["헤리티지 인상", "heritage appearance"],
  visual_boldness: ["시각적 존재감", "visual boldness"],
  affective_softness: ["부드러운 분위기", "soft mood"],
  unconventionality: ["독특함", "unconventionality"],
  sensuality: ["몸선 강조", "body emphasis"],
};
const axisImpressions: Record<string, [string, string]> = {
  formality: ["격식 있는 느낌", "a more formal mood"],
  refinement: ["깔끔하게 정돈된 인상", "a more polished impression"],
  technicality: [
    "아웃도어·장비를 떠올리게 하는 인상",
    "a more outdoors- or gear-inspired appearance",
  ],
  historical_orientation: [
    "클래식·빈티지를 떠올리게 하는 인상",
    "a more heritage-inspired appearance",
  ],
  visual_boldness: ["눈에 띄는 존재감", "a more visually striking appearance"],
  affective_softness: ["부드럽고 편안한 느낌", "a softer mood"],
  unconventionality: [
    "익숙한 디자인에서 벗어난 독특함",
    "a more unconventional design impression",
  ],
  sensuality: ["몸선을 강조하는 인상", "more emphasis on the body line"],
};
export function effectiveFacts(product: Product): Record<string, unknown> {
  return (
    (product.factsReviewedAt && product.humanStyleAttributes
      ? product.humanStyleAttributes
      : product.styleAttributes) || {}
  );
}
export function matchesFilters(product: Product, plan: AgentPlan): boolean {
  const f = plan.filters;
  if (f.category && product.category.toLowerCase() !== f.category.toLowerCase())
    return false;
  if (
    f.subCategory &&
    product.subCategory?.toLowerCase() !== f.subCategory.toLowerCase()
  )
    return false;
  if (f.brand && product.brand.toLowerCase() !== f.brand.toLowerCase())
    return false;
  if (
    f.targetGender &&
    ![f.targetGender, "unisex"].includes(
      getEffectiveProductTargetGender(product)
    )
  )
    return false;
  const text =
    `${product.name} ${product.brand} ${product.subCategory || ""}`.toLowerCase();
  if (f.keywords.some((word) => !text.includes(word.toLowerCase())))
    return false;
  const facts = effectiveFacts(product),
    axes = getEffectiveStyleAxes(product)?.axes;
  if (
    f.facts.some(
      ({ key, value }) =>
        facts[key] !== value &&
        !(Array.isArray(facts[key]) && facts[key].includes(value))
    )
  )
    return false;
  if (
    f.axes.some(
      ({ key, min, max }) =>
        !axes ||
        !(
          axes[key as keyof StyleAxes] >= min &&
          axes[key as keyof StyleAxes] <= max
        )
    )
  )
    return false;
  const profile = getProductStyleProfile(product);
  if (
    f.avoidedStyles.length &&
    (!profile ||
      profile.displayEntries
        .slice(0, 2)
        .some((entry) => f.avoidedStyles.includes(entry.key)))
  )
    return false;
  return (
    !f.preferredStyles.length ||
    Boolean(
      profile &&
      profile.displayEntries.some((entry) =>
        f.preferredStyles.includes(entry.key)
      )
    )
  );
}
export function meanAxes(products: Product[]): Partial<StyleAxes> {
  const values = products
    .map((p) => getEffectiveStyleAxes(p)?.axes)
    .filter((a): a is StyleAxes => Boolean(a));
  return values.length
    ? Object.fromEntries(
        AXES.map((key) => [
          key,
          values.reduce((sum, a) => sum + a[key], 0) / values.length,
        ])
      )
    : {};
}
export function axisSimilarity(
  product: Product,
  target: Partial<StyleAxes>
): number | null {
  const axes = getEffectiveStyleAxes(product)?.axes;
  if (!axes || !AXES.every((key) => typeof target[key] === "number"))
    return null;
  return Math.max(
    0,
    1 -
      Math.sqrt(
        AXES.reduce((sum, key) => sum + (axes[key] - target[key]!) ** 2, 0) /
          AXES.length
      ) /
        6
  );
}

export async function runEngine(
  userId: string,
  plan: AgentPlan,
  ids: string[],
  locale: string,
  evaluationRunId?: string
): Promise<AgentReply> {
  const en = locale === "en";
  const say = (ko: string, english: string) => (en ? english : ko);
  const notes: string[] = [];
  if (plan.unsupported.length)
    return {
      text: say(
        "이 조건은 현재 DIGBOX 데이터로 확인할 수 없어요. 해당 조건을 제외하고 찾아볼까요?",
        "DIGBOX cannot verify these requirements yet. Would you like to search without them?"
      ),
      products: [],
      notes: [
        say(
          `확인할 수 없는 조건: ${plan.unsupported.join(", ")}`,
          `Unavailable requirements: ${plan.unsupported.join(", ")}`
        ),
      ],
    };
  const needsTaste =
    plan.session?.candidateScope === "collection" ||
    plan.personalized ||
    plan.intent === "recommend" ||
    plan.intent === "taste" ||
    plan.intent === "compare" ||
    plan.exploration;
  const [collection, feedbackProfile] = needsTaste
    ? await Promise.all([
        getTasteSummary(userId, plan.source),
        getFeedbackProfile(userId),
      ])
    : [
        { products: [] as Product[] },
        {
          positiveAxes: {},
          negativeAxes: {},
          total: 0,
          actionableTotal: 0,
          reasons: {},
        },
      ];
  const tasteAxes = meanAxes(collection.products);
  const tasteConfidence = computeTasteConfidence(collection.products);
  traceEvent("algorithm", FASHION_AGENT_ALGORITHM);
  traceEvent("taste", {
    source: plan.source,
    collectionCount: collection.products.length,
    meanAxes: tasteAxes,
    confidence: tasteConfidence,
  });
  const summary = computeTasteSummary(collection.products);
  const sourceLabel =
    plan.source === "closet"
      ? say("옷장", "wardrobe")
      : say("저장한 상품", "saved products");
  const hasTaste = Object.keys(tasteAxes).length > 0;
  if (needsTaste && (plan.intent === "recommend" || plan.intent === "search"))
    await recordQueryTasteObservation(userId, plan, collection.products);
  if (needsTaste) {
    notes.push(
      say(
        `${sourceLabel} 최근 최대 500개의 스타일 분석을 기준으로 계산했어요.`,
        `Based on style analysis for up to 500 recent ${sourceLabel}.`
      )
    );
    if (!hasTaste)
      notes.push(
        say(
          "취향을 계산할 저장 상품의 스타일 분석이 부족해요.",
          "There is not enough saved-product style analysis to calculate taste yet."
        )
      );
    else
      notes.push(
        tasteConfidence.level === "high"
          ? say(
              `스타일 분석이 있는 ${tasteConfidence.analyzedCount}개 상품에서 반복되는 취향을 반영했어요.`,
              `Taste is based on recurring patterns across ${tasteConfidence.analyzedCount} analyzed products.`
            )
          : tasteConfidence.level === "medium"
            ? say(
                `스타일 분석이 있는 ${tasteConfidence.analyzedCount}개 상품을 반영했지만 취향 근거는 아직 보통 수준이에요.`,
                `Taste uses ${tasteConfidence.analyzedCount} analyzed products, with moderate evidence so far.`
              )
            : say(
                `스타일 분석이 있는 상품이 ${tasteConfidence.analyzedCount}개라 취향 점수는 참고 수준으로 반영했어요.`,
                `Only ${tasteConfidence.analyzedCount} analyzed products are available, so taste is a light signal.`
              )
      );
  }
  if (plan.intent === "taste") {
    const lines = summary.entries
      .slice(0, 3)
      .map((entry) =>
        say(
          `${styleProfileLabels(entry.tag)} ${entry.percent.toFixed(1)}%`,
          `${styleProfileLabels(entry.tag, "en")} ${entry.percent.toFixed(1)}%`
        )
      );
    const shift = computeTasteShift(collection.products, plan.source);
    return {
      presentation: {
        kind: "taste",
        title: say(
          `${sourceLabel}에서 발견한 취향`,
          "Your collection, in style"
        ),
        confidence: tasteConfidence.level,
        representatives: tasteRepresentatives(
          collection.products,
          summary.entries.slice(0, 3).map((entry) => entry.tag),
          locale
        ),
        distribution: summary.entries.map((entry) => ({
          label: styleProfileLabels(entry.tag, en ? "en" : "ko"),
          percent: Number(entry.percent.toFixed(1)),
        })),
      },
      text: lines.length
        ? say(
            `${summary.entries
              .slice(0, 3)
              .map((entry) => styleProfileLabels(entry.tag))
              .join(" · ")} 감각이 함께 나타나요.`,
            `Your collection blends ${summary.entries
              .slice(0, 3)
              .map((entry) => styleProfileLabels(entry.tag, "en"))
              .join(", ")}.`
          )
        : say(
            "아직 저장된 스타일 분석이 충분하지 않아요.",
            "There is not enough collection style analysis yet."
          ),
      products: [],
      notes: [
        ...notes,
        say(
          "상품의 스타일 분포이며, 실제 착용이나 성격을 의미하지 않아요.",
          "These are product style distributions, not claims about what you wear or your personality."
        ),
        ...(shift
          ? [
              say(
                "취향 변화는 현재 남아 있는 상품과 저장 시점을 기준으로 하므로 삭제한 상품의 과거 취향까지 재현하지는 못해요.",
                "Trend analysis uses currently retained products and their save dates, not a complete historical archive."
              ),
            ]
          : []),
      ],
    };
  }

  const rowsById = new Map<string, unknown>();
  async function loadProducts(productIds: string[]) {
    if (!productIds.length) return [];
    const { data, error } = await supabase!
      .from("products")
      .select(`${RECOMMENDATION_COLUMNS},facts_reviewed_at`)
      .in("id", productIds);
    if (error) throw error;
    const products: Product[] = [];
    for (const row of data || []) {
      const product = normalizeAnalysisProduct(row);
      if (product) {
        rowsById.set(product.id, row);
        products.push(product);
      }
    }
    return products;
  }
  const referenced = await loadProducts(ids);
  if (
    ["similar", "compatible", "compare"].includes(plan.intent) &&
    (referenced.length !== ids.length ||
      ids.length < (plan.intent === "compare" ? 2 : 1))
  ) {
    return {
      text: say(
        "비교하거나 기준으로 삼을 상품을 알려 주세요. 이전 결과의 번호나 DIGBOX 상품 링크를 보내 주세요.",
        "Please select the products using previous result numbers or DIGBOX product links."
      ),
      products: [],
      notes,
    };
  }
  let products: Product[];
  const engineReasons = new Map<string, string[]>();
  const engineScores = new Map<string, number>();
  if (
    plan.session?.candidateScope === "collection" &&
    ["search", "recommend"].includes(plan.intent)
  )
    products = await loadProducts(collection.products.map((p) => p.id));
  else if (plan.intent === "compare")
    products = ids.map((id) => referenced.find((p) => p.id === id)!);
  else if (plan.intent === "similar") {
    const recommendations = await getProductRecommendationData(ids[0]);
    const cards = recommendations?.similarProducts || [];
    products = await loadProducts(cards.map((p) => p.id));
    cards.forEach((card) => {
      engineScores.set(card.id, card.recommendation.score);
      engineReasons.set(card.id, [
        say(
          "기준 상품과 같은 카테고리이며 이미지·스타일 유사도를 기준으로 찾았어요.",
          "Same category as the reference, ranked by image and style similarity."
        ),
      ]);
    });
  } else {
    const preferred = STYLE_PROTOTYPE_CENTERS.find((center) =>
      plan.filters.preferredStyles.includes(center.key)
    );
    const referenceAxes =
      plan.intent === "compatible"
        ? getEffectiveStyleAxes(referenced[0])?.axes
        : undefined;
    const sessionTarget = Object.fromEntries(
      (plan.session?.axisPreferences || []).map(({ key, target }) => [
        key,
        target,
      ])
    );
    const targets = [preferred?.axes || referenceAxes || tasteAxes];
    if (Object.keys(sessionTarget).length)
      targets.push({ ...tasteAxes, ...sessionTarget });
    if (preferred && Object.keys(tasteAxes).length) targets.push(tasteAxes);
    const data = await retrieveCandidates(targets, async (target) => {
      const { data, error } = await supabase!.rpc("fashion_agent_search", {
        filters: plan.filters,
        target_axes: target,
      });
      if (error) throw error;
      traceEvent("retrieval", {
        channel: "catalog-axis-search",
        target,
        count: data?.length || 0,
        filters: plan.filters,
      });
      return data || [];
    });
    products = (data || [])
      .map((row: unknown) => {
        const p = normalizeAnalysisProduct(row);
        if (p) rowsById.set(p.id, row);
        return p;
      })
      .filter((p: Product | null): p is Product => Boolean(p));
    if (products.length >= 200)
      notes.push(
        say(
          "조건과 취향별 검색에서 얻은 제한된 후보 안에서 순위를 계산했어요.",
          "Ranked a bounded pool from condition and taste searches."
        )
      );
    if (plan.intent === "compatible") {
      products = products.filter((p) => {
        const source = referenced[0];
        const gender = getEffectiveProductTargetGender(source),
          other = getEffectiveProductTargetGender(p);
        if (
          p.id === source.id ||
          !isOutfitCategoryPair(source, p) ||
          (![gender, "unisex", "unknown"].includes(other) &&
            !["unisex", "unknown"].includes(gender))
        )
          return false;
        const result = getCrossCategoryStyleSimilarity(source, p);
        if (!result) return false;
        engineScores.set(p.id, result.score);
        engineReasons.set(p.id, [
          say(
            "기준 상품과 조합 가능한 카테고리이며 DIGBOX 스타일 조화 점수로 찾았어요.",
            "A complementary category, ranked by DIGBOX style harmony."
          ),
        ]);
        return true;
      });
      notes.push(
        say(
          "코디 적합도는 스타일 기반 추정이며 실제 착용을 보장하지 않아요.",
          "Compatibility is a style estimate, not a guarantee of fit or wearability."
        )
      );
    }
  }
  traceEvent("candidate_funnel", {
    stage: "candidate_pool",
    count: products.length,
    intent: plan.intent,
  });
  const savedIds = new Set(collection.products.map((p) => p.id));
  const relationships = await candidateRelationships(
    userId,
    products.map((product) => product.id)
  );
  if (
    plan.session?.candidateScope === "collection" &&
    plan.intent !== "compare"
  )
    products = products.filter((product) => savedIds.has(product.id));
  if (plan.intent !== "compare")
    products = products.filter(
      (p) =>
        matchesFilters(p, plan) &&
        (!plan.exploration || relationships.get(p.id) === "new")
    );
  traceEvent("candidate_funnel", {
    stage: "after_hard_filters",
    count: products.length,
    candidateScope: plan.session?.candidateScope || "catalog",
    exploration: plan.exploration,
  });
  const scored = products
    .map((product) => {
      const affinity = axisSimilarity(product, tasteAxes);
      const taste = affinity;
      const vector = styleProfileVector(product);
      const styleScore = plan.filters.preferredStyles.reduce(
        (sum, key) => sum + Number(vector?.[key as StyleProfileKey] || 0),
        0
      );
      const duplicate = plan.exploration
        ? Math.max(
            0,
            ...collection.products
              .filter((p) => p.category === product.category)
              .map(
                (p) =>
                  axisSimilarity(
                    product,
                    getEffectiveStyleAxes(p)?.axes || {}
                  ) ?? 0
              )
          )
        : 0;
      const novelty = 1 - duplicate;
      const reasons = [...(engineReasons.get(product.id) || [])];
      const axes = getEffectiveStyleAxes(product)?.axes;
      const sessionScore = sessionAffinity(
        axes,
        plan.session?.axisPreferences || []
      );
      if (sessionScore !== null && sessionScore >= 0.75) {
        reasons.push(
          say(
            `이번 요청의 ${plan.session!.axisPreferences.map(({ key }) => axisLabels[key]?.[0] || key).join("·")} 선호에 가까운 분석값이에요.`,
            "Its analyzed style axes are close to your preferences in this request."
          )
        );
      }
      if (needsTaste && axes && affinity !== null) {
        const closest = AXES.filter(
          (key) => Math.abs(axes[key] - tasteAxes[key]!) <= 1
        ).slice(0, 2);
        if (closest.length)
          reasons.push(
            say(
              `${closest.map((key) => axisLabels[key][0]).join("·")} 점수가 ${sourceLabel}의 평균과 가까워요.`,
              `${closest.map((key) => axisLabels[key][1]).join(" and ")} are close to your collection average.`
            )
          );
      }
      for (const fact of plan.filters.facts.slice(0, 2)) {
        const field = STYLE_ATTRIBUTE_FIELDS.find((f) => f.key === fact.key);
        const label =
          field?.options.find((o: { value: string }) => o.value === fact.value)
            ?.label || fact.value;
        reasons.push(
          say(
            `등록된 분석의 ${field?.label || fact.key}: ${label}`,
            `Catalog analysis — ${fact.key}: ${fact.value}`
          )
        );
      }
      if (plan.exploration)
        reasons.push(
          say(
            "선택한 컬렉션에 없는 상품이며 스타일 중복도가 낮은 후보에 가점을 줬어요.",
            "Not in this collection; less repetitive styles receive a ranking bonus."
          )
        );
      if (!reasons.length)
        reasons.push(
          say(
            "입력한 검색 조건에 맞는 DIGBOX 상품이에요.",
            "Matches your DIGBOX search criteria."
          )
        );
      return {
        product,
        taste,
        reasons,
        components: {
          base:
            engineScores.get(product.id) ??
            (needsTaste ? (taste ?? 0) : styleScore),
          session: sessionScore,
          novelty,
          feedbackShadow: feedbackAdjustment(product, feedbackProfile, novelty),
        },
        score: rankingScore({
          base:
            engineScores.get(product.id) ??
            (needsTaste ? (taste ?? 0) : styleScore),
          session: sessionScore,
          tasteConfidence: needsTaste ? tasteConfidence.confidence : 1,
          novelty,
          noveltyLevel: plan.exploration
            ? plan.session?.novelty || "medium"
            : "none",
        }),
      };
    })
    .filter(
      (item) => !plan.exploration || (item.taste !== null && item.taste >= 0.65)
    );
  if (plan.intent !== "compare")
    scored.sort(
      (a, b) => b.score - a.score || a.product.id.localeCompare(b.product.id)
    );
  const feedbackEligible =
    plan.personalized &&
    ["recommend", "search"].includes(plan.intent) &&
    feedbackProfile.total >= 3 &&
    feedbackProfile.actionableTotal >= 3 &&
    scored.length >= 2;
  const feedbackScored = feedbackEligible
    ? [...scored].sort(
        (a, b) =>
          b.score +
            b.components.feedbackShadow -
            (a.score + a.components.feedbackShadow) ||
          a.product.id.localeCompare(b.product.id)
      )
    : [];
  if (needsTaste && (plan.intent === "recommend" || plan.intent === "search")) {
    await recordShadow(
      userId,
      plan,
      collection.products,
      scored.map((item) => item.product),
      scored.slice(0, 5).map((item) => item.product.id),
      evaluationRunId
    );
  }
  traceEvent("ranking", {
    algorithmVersion: FASHION_AGENT_ALGORITHM.ranking,
    intent: plan.intent,
    filters: plan.filters,
    retrievedCount: products.length,
    rankedCount: scored.length,
    displayedCount: Math.min(8, scored.length),
    tasteConfidence: tasteConfidence.confidence,
    top: scored.slice(0, 8).map((item) => ({
      id: item.product.id,
      score: item.score,
      taste: item.taste,
      components: item.components,
      reasons: item.reasons,
    })),
  });
  const toCard = (
    item: (typeof scored)[number],
    feedbackAware = false
  ): AgentProduct | null => {
    const card = normalizeProductCard(rowsById.get(item.product.id));
    if (!card) return null;
    const reasons = [...item.reasons];
    if (feedbackAware && Math.abs(item.components.feedbackShadow) >= 0.001)
      reasons.push(
        say(
          "반복해서 남긴 추천 피드백과 비슷한 스타일 신호를 실험적으로 반영했어요.",
          "Experimentally reflects style signals repeated in your recommendation feedback."
        )
      );
    return {
      ...card,
      relationship: relationships.get(card.id),
      reasons,
      evidence: {
        source: needsTaste ? plan.source : "query",
        analyzedCount: tasteConfidence.analyzedCount,
        confidence: tasteConfidence.level,
        sessionMatch: item.components.session,
        caveats: [
          say(
            "색상·소재·핏은 등록된 시각 분석이며 실제 사양과 다를 수 있어요.",
            "Color, material and fit come from visual analysis and may differ from actual specifications."
          ),
          ...(plan.exploration
            ? [
                say(
                  "저장·옷장에 등록된 상품은 제외했어요. 등록하지 않은 보유 상품은 알 수 없어요.",
                  "Items in your saved list and wardrobe are excluded; unregistered ownership is unknown."
                ),
              ]
            : []),
        ],
      },
      tasteScore:
        needsTaste && item.taste !== null ? Math.round(item.taste * 100) : null,
    };
  };
  const usesDiscoveryMix =
    plan.session?.candidateScope !== "collection" &&
    ["recommend", "search", "compatible"].includes(plan.intent);
  const select = (items: typeof scored) =>
    usesDiscoveryMix
      ? discoveryMix(items, (item) => relationships.get(item.product.id))
      : items.slice(0, 8);
  const cards: AgentProduct[] = select(scored)
    .slice(0, 8)
    .flatMap((item) => toCard(item) || []);
  const feedbackCards: AgentProduct[] = select(feedbackScored)
    .slice(0, 8)
    .flatMap((item) => toCard(item, true) || []);
  const changedPositions = feedbackEligible
    ? cards
        .slice(0, 5)
        .filter((card, index) => feedbackCards[index]?.id !== card.id).length
    : 0;
  const comparisonEligible = feedbackEligible && changedPositions > 0;
  traceEvent("display_selection", {
    policy: usesDiscoveryMix ? "catalog-max-two-familiar" : "relevance-order",
    productIds: cards.map((card) => card.id),
    composition: Object.fromEntries(
      ["new", "saved", "owned"].map((relationship) => [
        relationship,
        cards.filter((card) => card.relationship === relationship).length,
      ])
    ),
  });
  if (plan.personalized && ["recommend", "search"].includes(plan.intent))
    traceEvent("feedback_shadow", {
      baselineVersion: FASHION_AGENT_ALGORITHM.ranking,
      challengerVersion: FASHION_AGENT_ALGORITHM.feedbackShadow,
      eligible: comparisonEligible,
      ineligibleReason: comparisonEligible
        ? null
        : feedbackProfile.total < 3
          ? "fewer_than_3_feedback_events"
          : feedbackProfile.actionableTotal < 3
            ? "fewer_than_3_actionable_feedback_events"
            : scored.length < 2
              ? "insufficient_candidates"
              : changedPositions === 0
                ? "ranking_unchanged"
                : "not_a_personalized_ranking",
      feedback: {
        total: feedbackProfile.total,
        actionableTotal: feedbackProfile.actionableTotal,
        reasons: feedbackProfile.reasons,
        strength: Math.min(1, feedbackProfile.actionableTotal / 10),
      },
      optionA: Math.random() < 0.5 ? "challenger" : "baseline",
      baselineProducts: cards.slice(0, 5),
      challengerProducts: feedbackCards.slice(0, 5),
      changedPositions,
    });
  let text = cards.length
    ? say("이 상품들을 찾아봤어요.", "Here are the matching products.")
    : say(
        "현재 확인 가능한 데이터에서 조건에 맞는 상품을 찾지 못했어요. 조건을 조금 넓혀볼까요?",
        "No products matched the available data. Try broadening the requirements."
      );
  if (plan.intent === "compare" && referenced.length >= 2) {
    const left = referenced.find((p) => p.id === ids[0])!,
      right = referenced.find((p) => p.id === ids[1])!;
    const a = getEffectiveStyleAxes(left)?.axes,
      b = getEffectiveStyleAxes(right)?.axes;
    const differences =
      a && b
        ? AXES.filter((key) => a[key] !== b[key])
            .sort((x, y) => Math.abs(a[y] - b[y]) - Math.abs(a[x] - b[x]))
            .slice(0, 3)
        : [];
    text = differences.length
      ? differences
          .map((key) =>
            say(
              `${a![key] > b![key] ? left.name : right.name}에서 ${axisImpressions[key][0]}이 더 느껴져요.`,
              `${a![key] > b![key] ? left.name : right.name} has ${axisImpressions[key][1]}.`
            )
          )
          .join("\n")
      : say(
          "비교할 스타일 축 데이터가 부족하거나 두 상품의 점수가 같아요.",
          "Style axis data is missing or the scores are identical."
        );
    const ranked = [...scored]
      .filter((p) => p.taste !== null)
      .sort((x, y) => y.taste! - x.taste!);
    if (ranked.length >= 2 && ranked[0].taste! - ranked[1].taste! > 0.01)
      text += say(
        `\n취향 점수는 ${ranked[0].product.name}이 더 높아요.`,
        `\n${ranked[0].product.name} has the higher taste score.`
      );
    notes.push(
      say(
        "비교 문장의 숫자는 첫 번째 상품 / 두 번째 상품 순서예요. 스타일 점수는 디자인 인상에 대한 분석입니다.",
        "Scores are listed as first product / second product. Style scores describe design impressions."
      )
    );
  }
  return {
    text,
    products: cards,
    notes,
    presentation: {
      kind:
        plan.intent === "compare"
          ? "compare"
          : plan.intent === "compatible"
            ? "compatible"
            : "recommend",
      title: say(
        plan.intent === "compare"
          ? "두 상품의 스타일 비교"
          : plan.intent === "compatible"
            ? "함께 입기 좋은 조합"
            : "이번 요청에 맞는 발견",
        plan.intent === "compare"
          ? "Style comparison"
          : plan.intent === "compatible"
            ? "Made to pair"
            : "Your edit"
      ),
      reference:
        plan.intent === "compatible"
          ? normalizeProductCard(rowsById.get(ids[0])) || undefined
          : undefined,
      comparedProducts:
        plan.intent === "compare"
          ? ids.flatMap((id) => {
              const product = referenced.find((product) => product.id === id);
              return product ? [compactCard(product)] : [];
            })
          : undefined,
      axes:
        plan.intent === "compare"
          ? AXES.flatMap((key) => {
              const values = ids.flatMap((id) => {
                const product = referenced.find(
                  (product) => product.id === id
                )!;
                const axes = getEffectiveStyleAxes(product)?.axes;
                return axes ? [{ name: product.name, value: axes[key] }] : [];
              });
              return values.length === 2
                ? [
                    {
                      label: axisLabels[key][en ? 1 : 0],
                      values,
                      explanation:
                        Math.abs(values[0].value - values[1].value) <= 0.5
                          ? say(
                              "두 상품의 디자인 인상이 비슷해요.",
                              "Both products have a similar impression here."
                            )
                          : say(
                              `${values[0].value > values[1].value ? "첫 번째" : "두 번째"} 상품에서 ${axisImpressions[key][0]}이 ${Math.abs(values[0].value - values[1].value) < 1.5 ? "조금 더" : Math.abs(values[0].value - values[1].value) < 2.5 ? "더 뚜렷하게" : "훨씬 더"} 느껴져요.`,
                              `The ${values[0].value > values[1].value ? "first" : "second"} product has ${axisImpressions[key][1]}.`
                            ),
                    },
                  ]
                : [];
            })
          : undefined,
    },
  };
}
