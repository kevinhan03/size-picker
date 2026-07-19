import type { Product, StyleTagName, StyleTags } from "../types";

export const TAGS: StyleTagName[] = [
  "casual",
  "minimal",
  "street",
  "classic",
  "vintage",
  "lovely_romantic",
  "sporty",
  "workwear_gorpcore",
  "chic_modern",
  "glam_sexy",
];

// 10개 태그 카테고리 색상 - dataviz 스킬 validate_palette.js로 다크 모드/전체쌍 CVD 검증 완료
// (worst all-pairs ΔE 8.5, deutan floor-band 통과 — 태그 노드에 항상 라벨 텍스트가 같이 그려지므로
// secondary encoding 요건 충족)
export const TAG_COLORS: Record<StyleTagName, { base: string; bright: string }> = {
  casual: { base: "#3987e5", bright: "#5598e9" },
  minimal: { base: "#199e70", bright: "#39ac84" },
  street: { base: "#c98500", bright: "#d19624" },
  classic: { base: "#008300", bright: "#249424" },
  vintage: { base: "#8f3fe0", bright: "#9f5ae4" },
  lovely_romantic: { base: "#e66767", bright: "#ea7c7c" },
  sporty: { base: "#c94f9e", bright: "#d168ac" },
  workwear_gorpcore: { base: "#d95926", bright: "#de7044" },
  chic_modern: { base: "#2a9fb0", bright: "#48acbb" },
  glam_sexy: { base: "#e0629c", bright: "#e478aa" },
};

export const DEFAULT_TAG_COLOR = { base: "#f59e0b", bright: "#f97316" };

export const tagColor = (tag: string) => TAG_COLORS[tag as StyleTagName] || DEFAULT_TAG_COLOR;

export const LEGACY_TAG_KEY_MAP: Record<string, StyleTagName> = {
  "캐주얼": "casual",
  "미니멀": "minimal",
  "스트릿": "street",
  "클래식": "classic",
  "빈티지": "vintage",
  "레트로": "vintage",
  "로맨틱": "lovely_romantic",
  "스포티": "sporty",
  "워크웨어": "workwear_gorpcore",
};

export const TAG_TOP_N = 2;
export const PRODUCT_PANEL_TAG_TOP_N = 5;
export const SECOND_TAG_MIN_CONFIDENCE = 0.15;
export const EMBEDDING_TOP_K = 2;
export const SIMILAR_TOP_K = 5;
export const ITEM_COLLAPSED_OPACITY = 0.82;
export const SEARCH_DIM_OPACITY = 0.06;
export const ITEM_COLLAPSED_RADIUS = 16;
export const ITEM_DETAIL_RADIUS = 24;
export const MIN_TAG_RADIUS = 18;
export const MAX_TAG_RADIUS = 32;
export const TAG_LABEL_ZOOM_FADE_START = 2.0;
export const TAG_LABEL_ZOOM_FADE_END = 2.35;

export function parseEmbedding(raw: unknown): number[] | null {
  if (Array.isArray(raw)) {
    const values = raw.map(Number).filter(Number.isFinite);
    return values.length ? values : null;
  }

  if (typeof raw === "string") {
    const cleaned = raw.trim().replace(/^\[/, "").replace(/\]$/, "");
    const values = cleaned
      .split(",")
      .map((value) => Number(value.trim()))
      .filter(Number.isFinite);
    return values.length ? values : null;
  }

  if (raw && typeof raw === "object" && Array.isArray((raw as { values?: unknown }).values)) {
    const values = (raw as { values: unknown[] }).values.map(Number).filter(Number.isFinite);
    return values.length ? values : null;
  }

  return null;
}

export function cosineSimilarity(a: number[], b: number[]): number | null {
  const length = Math.min(a.length, b.length);
  if (!length) return null;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < length; index += 1) {
    const av = a[index];
    const bv = b[index];
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }

  if (!normA || !normB) return null;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function normalizeStyleTags(styleTags: unknown): Partial<StyleTags> {
  if (!styleTags || typeof styleTags !== "object" || Array.isArray(styleTags)) return {};
  const normalized: Partial<StyleTags> = {};
  for (const [rawTag, rawScore] of Object.entries(styleTags as Record<string, unknown>)) {
    const tag = (TAGS as string[]).includes(rawTag) ? (rawTag as StyleTagName) : LEGACY_TAG_KEY_MAP[rawTag];
    if (!tag) continue;
    const score = Number(rawScore);
    if (Number.isFinite(score)) {
      normalized[tag] = Math.max(normalized[tag] || 0, Math.min(1, Math.max(0, score)));
    }
  }
  return normalized;
}

export function getEffectiveStyleTags(product: Product): { tags: unknown; source: "human" | "ai" } {
  const status = String(product.tagReviewStatus || "").trim();
  const hasReviewedTags =
    product.humanStyleTags &&
    typeof product.humanStyleTags === "object" &&
    !Array.isArray(product.humanStyleTags);

  if ((status === "approved" || status === "edited") && hasReviewedTags) {
    return { tags: product.humanStyleTags, source: "human" };
  }

  return { tags: product.styleTags, source: "ai" };
}

export function selectTopTags(
  styleTags: Partial<StyleTags>,
  limit = TAG_TOP_N,
  options: { enforceSecondThreshold?: boolean } = {}
): [StyleTagName, number][] {
  const enforceSecondThreshold = options.enforceSecondThreshold !== false;
  const sorted = (Object.entries(styleTags) as [StyleTagName, number][])
    .filter(([, score]) => Number.isFinite(score) && score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (!enforceSecondThreshold || sorted.length <= 1) return sorted;
  if (sorted[1][1] < SECOND_TAG_MIN_CONFIDENCE) return [sorted[0]];
  return sorted;
}

export interface TasteGraphProduct {
  id: string;
  nodeId: string;
  label: string;
  brand: string;
  imageUrl: string;
  styleTags: Partial<StyleTags>;
  styleTagSource: "human" | "ai";
  tagReviewStatus: string;
  tagReviewNote: string;
  embedding: number[] | null;
  tagAssignments: { tag: StyleTagName; score: number; rank: number }[];
  panelTagAssignments: { tag: StyleTagName; score: number; rank: number }[];
}

export interface TasteGraphNode {
  id: string;
  type: "item" | "tag";
  productId?: string;
  label: string;
  imageUrl?: string;
  product?: TasteGraphProduct;
  count?: number;
  radius: number;
  visible: boolean;
  opacity: number;
  baseOpacity?: number;
  selected?: boolean;
  connected?: boolean;
  similar?: boolean;
  highlighted?: boolean;
  x?: number;
  y?: number;
}

export interface TasteGraphLink {
  source: string;
  target: string;
  tag?: StyleTagName;
  productNodeId?: string;
  weight: number;
  rank?: number;
  normalizedStrength?: number;
  type: "tag" | "embedding";
  visible: boolean;
  opacity?: number;
  highlighted?: boolean;
}

export interface TasteGraphState {
  nodes: TasteGraphNode[];
  links: TasteGraphLink[];
  forceLinks: TasteGraphLink[];
  embeddingForceLinks: TasteGraphLink[];
  products: TasteGraphProduct[];
  productByNodeId: Map<string, TasteGraphProduct>;
  tagItems: Map<StyleTagName, { productNodeId: string; weight: number; rank: number }[]>;
  warnings: { missingStyleTags: number; missingEmbedding: number; invalidEmbedding: number; missingImagePath: number };
  counts: { items: number; tags: number; tagLinks: number; embeddingLinks: number };
}

export function createGraph(products: Product[]): TasteGraphState {
  const warnings = { missingStyleTags: 0, missingEmbedding: 0, invalidEmbedding: 0, missingImagePath: 0 };
  const nodes: TasteGraphNode[] = [];
  const tagLinks: TasteGraphLink[] = [];
  const tagItems = new Map<StyleTagName, { productNodeId: string; weight: number; rank: number }[]>(
    TAGS.map((tag) => [tag, []])
  );
  const tagCounts = new Map<StyleTagName, number>(TAGS.map((tag) => [tag, 0]));
  const productByNodeId = new Map<string, TasteGraphProduct>();

  const items: TasteGraphProduct[] = products.map((product) => {
    const embedding = parseEmbedding(product.imageEmbedding);
    const effectiveStyleTags = getEffectiveStyleTags(product);
    if (!effectiveStyleTags.tags) warnings.missingStyleTags += 1;
    if (!product.imageEmbedding) warnings.missingEmbedding += 1;
    if (product.imageEmbedding && !embedding) warnings.invalidEmbedding += 1;
    if (!product.imagePath) warnings.missingImagePath += 1;

    return {
      id: String(product.id),
      nodeId: `item:${product.id}`,
      label: String(product.name || `Product ${product.id}`),
      brand: String(product.brand || "").trim(),
      imageUrl: product.thumbnailImage || product.image || "",
      styleTags: normalizeStyleTags(effectiveStyleTags.tags),
      styleTagSource: effectiveStyleTags.source,
      tagReviewStatus: String(product.tagReviewStatus || "").trim(),
      tagReviewNote: String(product.tagReviewNote || "").trim(),
      embedding,
      tagAssignments: [],
      panelTagAssignments: [],
    };
  });

  for (const product of items) {
    const topTags = selectTopTags(product.styleTags);
    product.tagAssignments = topTags.map(([tag, score], index) => ({ tag, score, rank: index + 1 }));
    product.panelTagAssignments = selectTopTags(product.styleTags, PRODUCT_PANEL_TAG_TOP_N, {
      enforceSecondThreshold: false,
    }).map(([tag, score], index) => ({ tag, score, rank: index + 1 }));
    productByNodeId.set(product.nodeId, product);

    nodes.push({
      id: product.nodeId,
      type: "item",
      productId: product.id,
      label: product.label,
      imageUrl: product.imageUrl,
      product,
      radius: ITEM_COLLAPSED_RADIUS,
      visible: true,
      opacity: ITEM_COLLAPSED_OPACITY,
    });

    const scoreTotal = topTags.reduce((sum, [, score]) => sum + score, 0) || 1;
    topTags.forEach(([tag, score], index) => {
      const link: TasteGraphLink = {
        source: product.nodeId,
        target: `tag:${tag}`,
        tag,
        productNodeId: product.nodeId,
        weight: score,
        rank: index + 1,
        normalizedStrength: score / scoreTotal,
        type: "tag",
        visible: true,
      };
      tagLinks.push(link);
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      tagItems.get(tag)!.push({ productNodeId: product.nodeId, weight: score, rank: index + 1 });
    });
  }

  const connectedTags = TAGS.filter((tag) => (tagCounts.get(tag) || 0) > 0);
  const maxTagCount = Math.max(1, ...connectedTags.map((tag) => tagCounts.get(tag) || 0));
  for (const tag of connectedTags) {
    const count = tagCounts.get(tag) || 0;
    nodes.push({
      id: `tag:${tag}`,
      type: "tag",
      label: tag,
      count,
      radius: MIN_TAG_RADIUS + (MAX_TAG_RADIUS - MIN_TAG_RADIUS) * Math.sqrt(count / maxTagCount),
      visible: true,
      opacity: 1,
    });
    tagItems.get(tag)!.sort((a, b) => b.weight - a.weight || a.rank - b.rank);
  }

  const embeddingForceLinks = createEmbeddingForceLinks(items);
  const forceLinks = [...tagLinks, ...embeddingForceLinks];

  return {
    nodes,
    links: tagLinks,
    forceLinks,
    embeddingForceLinks,
    products: items,
    productByNodeId,
    tagItems,
    warnings,
    counts: {
      items: items.length,
      tags: connectedTags.length,
      tagLinks: tagLinks.length,
      embeddingLinks: embeddingForceLinks.length,
    },
  };
}

export function createEmbeddingForceLinks(products: TasteGraphProduct[]): TasteGraphLink[] {
  const productsWithEmbedding = products.filter((product) => product.embedding);
  const pairMap = new Map<string, TasteGraphLink>();

  for (const product of productsWithEmbedding) {
    const scored: { other: TasteGraphProduct; similarity: number }[] = [];
    for (const other of productsWithEmbedding) {
      if (product.id === other.id) continue;
      const similarity = cosineSimilarity(product.embedding!, other.embedding!);
      if (Number.isFinite(similarity)) scored.push({ other, similarity: similarity as number });
    }

    scored.sort((a, b) => b.similarity - a.similarity);
    for (const entry of scored.slice(0, EMBEDDING_TOP_K)) {
      const left = product.nodeId < entry.other.nodeId ? product.nodeId : entry.other.nodeId;
      const right = product.nodeId < entry.other.nodeId ? entry.other.nodeId : product.nodeId;
      const key = `${left}|${right}`;
      const existing = pairMap.get(key);
      const weight = Math.max(0, Math.min(1, entry.similarity));

      if (!existing || weight > existing.weight) {
        pairMap.set(key, {
          source: left,
          target: right,
          weight,
          type: "embedding",
          visible: false,
        });
      }
    }
  }

  return Array.from(pairMap.values());
}

export interface TasteSummaryEntry {
  tag: StyleTagName;
  percent: number;
}

export interface TasteSummary {
  entries: TasteSummaryEntry[];
  taggedCount: number;
  totalCount: number;
}

export type TasteCollectionSource = "closet" | "digbox";

export interface TasteComparisonEntry {
  tag: StyleTagName;
  closetPercent: number;
  digboxPercent: number;
  difference: number;
}

export interface TasteInsightRecommendation {
  product: Product;
  tag: StyleTagName;
  score: number;
}

export interface TasteCollectionComparison {
  closet: TasteSummary;
  digbox: TasteSummary;
  entries: TasteComparisonEntry[];
  shared: TasteComparisonEntry | null;
  aspirations: TasteComparisonEntry[];
  saturated: TasteComparisonEntry | null;
  recommendations: TasteInsightRecommendation[];
}

export type ProductTasteDecisionKind = "new_direction" | "core_match" | "overlap";

export interface ProductTasteDecision {
  kind: ProductTasteDecisionKind;
  primaryTag: StyleTagName;
  secondaryTag?: StyleTagName;
  closetShare: number;
  tagEvidence: Array<{
    tag: StyleTagName;
    productScore: number;
    closetShare: number;
  }>;
  closestProducts: Array<{
    product: Product;
    similarity: number;
    styleSimilarity: number;
    sameCategory: boolean;
    shapeSimilarity: number | null;
    expressionSimilarity: number | null;
    shapeMatches: string[];
    expressionMatches: string[];
  }>;
}

export interface TasteCollectionInterpretation {
  title: string;
  summary: string;
  coreTags: StyleTagName[];
  details: string[];
  axes: Array<{ title: string; label: string }>;
}

const TAG_TASTE_COPY: Record<StyleTagName, string> = {
  casual: "편안한 데일리함",
  minimal: "정돈된 형태",
  street: "도시적인 존재감",
  classic: "단정한 구조감",
  vintage: "시간감 있는 질감",
  lovely_romantic: "부드럽고 섬세한 장식",
  sporty: "활동적인 리듬",
  workwear_gorpcore: "실용적인 디테일",
  chic_modern: "선명한 현대적 긴장감",
  glam_sexy: "드레스업을 의식한 화려함",
};

const TAG_LABELS: Record<StyleTagName, string> = {
  casual: "캐주얼",
  minimal: "미니멀",
  street: "스트리트",
  classic: "클래식",
  vintage: "빈티지",
  lovely_romantic: "러블리 로맨틱",
  sporty: "스포티",
  workwear_gorpcore: "워크웨어 고프코어",
  chic_modern: "시크 모던",
  glam_sexy: "글램 섹시",
};

export function styleTagLabel(tag: StyleTagName) {
  return TAG_LABELS[tag];
}

// 조사(을/를, 이/가) 선택을 위해 영문 라벨의 한글 발음을 기준으로 받침 여부를 판정한다.
const TAG_LABEL_READINGS: Record<StyleTagName, string> = {
  casual: "캐주얼",
  minimal: "미니멀",
  street: "스트리트",
  classic: "클래식",
  vintage: "빈티지",
  lovely_romantic: "러블리 로맨틱",
  sporty: "스포티",
  workwear_gorpcore: "워크웨어 고프코어",
  chic_modern: "시크 모던",
  glam_sexy: "글램 섹시",
};

function endsWithBatchim(word: string): boolean {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

const josa = (reading: string, withBatchim: string, withoutBatchim: string) =>
  endsWithBatchim(reading) ? withBatchim : withoutBatchim;

const COLLECTION_AXES: Array<{
  title: string;
  positiveLabel: string;
  negativeLabel: string;
  positiveTags: StyleTagName[];
  negativeTags: StyleTagName[];
}> = [
  {
    title: "무드의 방향",
    positiveLabel: "정돈된 구조감",
    negativeLabel: "실용적인 장비감",
    positiveTags: ["classic", "chic_modern"],
    negativeTags: ["casual", "sporty", "workwear_gorpcore"],
  },
  {
    title: "표면의 결",
    positiveLabel: "깨끗하고 매끈한 인상",
    negativeLabel: "질감과 사용감이 있는 인상",
    positiveTags: ["minimal", "chic_modern"],
    negativeTags: ["vintage", "workwear_gorpcore"],
  },
  {
    title: "표현의 강도",
    positiveLabel: "절제된 표현",
    negativeLabel: "분명한 존재감",
    positiveTags: ["minimal", "classic"],
    negativeTags: ["street", "lovely_romantic", "glam_sexy"],
  },
  {
    title: "시간의 결",
    positiveLabel: "시간감 있는 헤리티지",
    negativeLabel: "동시대적인 선명함",
    positiveTags: ["classic", "vintage"],
    negativeTags: ["chic_modern", "street", "sporty"],
  },
];

const ATTRIBUTE_LABELS: Record<string, Record<string, string>> = {
  fit: {
    relaxed: "여유 있는 핏",
    wide: "와이드한 비율",
    slim: "몸에 가까운 핏",
    straight: "곧은 비율",
    tapered: "정리된 테이퍼드 핏",
  },
  silhouette: {
    clean: "깨끗한 실루엣",
    structured: "구조적인 실루엣",
    loose: "느슨한 실루엣",
    voluminous: "볼륨 있는 실루엣",
    draped: "흐르는 실루엣",
  },
  formality: {
    casual: "일상적인 격식",
    "smart-casual": "정돈된 캐주얼",
    formal: "드레스업 가능한 격식",
  },
  utility_level: {
    none: "장식보다 형태 중심",
    light: "가벼운 실용 디테일",
    strong: "뚜렷한 실용 디테일",
  },
};

// 상품 단위로 그래프의 태그 링크(tagAssignments)와 동일한 top-tag 집계를 재사용해
// 옷장 전체의 스타일 분포를 계산한다. 원본 10개 태그 점수를 그대로 평균 내지 않고,
// 그래프에 실제로 표시되는 상위 태그(들)만 집계 대상으로 삼아 그래프와 숫자가 항상 일치하게 한다.
export function computeTasteSummary(products: Product[]): TasteSummary {
  const totals = new Map<StyleTagName, number>(TAGS.map((tag) => [tag, 0]));
  let taggedCount = 0;

  for (const product of products) {
    const effective = getEffectiveStyleTags(product);
    const normalized = normalizeStyleTags(effective.tags);
    const topTags = selectTopTags(normalized);
    if (!topTags.length) continue;

    taggedCount += 1;
    const scoreTotal = topTags.reduce((sum, [, score]) => sum + score, 0) || 1;
    for (const [tag, score] of topTags) {
      totals.set(tag, (totals.get(tag) || 0) + score / scoreTotal);
    }
  }

  const grandTotal = Array.from(totals.values()).reduce((sum, value) => sum + value, 0) || 1;
  const entries = TAGS.map((tag) => ({ tag, percent: ((totals.get(tag) || 0) / grandTotal) * 100 }))
    .filter((entry) => entry.percent > 0)
    .sort((a, b) => b.percent - a.percent);

  return { entries, taggedCount, totalCount: products.length };
}

export function compareTasteCollections(closetProducts: Product[], digboxProducts: Product[]): TasteCollectionComparison {
  const closet = computeTasteSummary(closetProducts);
  const digbox = computeTasteSummary(digboxProducts);
  const closetPercentByTag = new Map(closet.entries.map((entry) => [entry.tag, entry.percent]));
  const digboxPercentByTag = new Map(digbox.entries.map((entry) => [entry.tag, entry.percent]));
  const entries = TAGS.map((tag) => {
    const closetPercent = closetPercentByTag.get(tag) || 0;
    const digboxPercent = digboxPercentByTag.get(tag) || 0;
    return { tag, closetPercent, digboxPercent, difference: digboxPercent - closetPercent };
  });

  const shared = [...entries]
    .filter((entry) => entry.closetPercent >= 7 && entry.digboxPercent >= 7)
    .sort((left, right) => Math.min(right.closetPercent, right.digboxPercent) - Math.min(left.closetPercent, left.digboxPercent))[0] || null;
  const aspirations = [...entries]
    .filter((entry) => entry.digboxPercent >= 8 && entry.difference >= 4)
    .sort((left, right) => right.difference - left.difference)
    .slice(0, 2);
  const saturated = [...entries]
    .filter((entry) => entry.closetPercent >= 8 && entry.difference <= -4)
    .sort((left, right) => left.difference - right.difference)[0] || null;

  const recommendedProductIds = new Set<string>();
  const recommendations = aspirations.flatMap((aspiration) => {
    const candidates = digboxProducts
      .map((product) => ({ product, score: normalizeStyleTags(getEffectiveStyleTags(product).tags)[aspiration.tag] || 0 }))
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);

    return candidates.flatMap((candidate) => {
      const id = String(candidate.product.id);
      if (recommendedProductIds.has(id)) return [];
      recommendedProductIds.add(id);
      return [{ product: candidate.product, tag: aspiration.tag, score: candidate.score }];
    });
  }).slice(0, 3);

  return { closet, digbox, entries, shared, aspirations, saturated, recommendations };
}

function tagVector(product: Product) {
  const tags = normalizeStyleTags(getEffectiveStyleTags(product).tags);
  const values = TAGS.map((tag) => Number(tags[tag] || 0));
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  return magnitude ? values.map((value) => value / magnitude) : null;
}

function styleSimilarity(left: Product, right: Product) {
  const leftVector = tagVector(left);
  const rightVector = tagVector(right);
  if (!leftVector || !rightVector) return null;
  return leftVector.reduce((sum, value, index) => sum + value * rightVector[index], 0);
}

const SHAPE_ATTRIBUTE_KEYS = ["bottom_silhouette", "top_length"];
const EXPRESSION_ATTRIBUTE_KEYS = ["material", "color", "wash_texture", "details"];

function comparableAttributeValue(value: unknown): string | null {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized && normalized !== "unknown" ? normalized : null;
}

function attributeValuesMatch(left: unknown, right: unknown): boolean | null {
  if (Array.isArray(left) || Array.isArray(right)) {
    const leftValues = Array.isArray(left)
      ? left.map(comparableAttributeValue).filter((value): value is string => Boolean(value))
      : [];
    const rightValues = Array.isArray(right)
      ? right.map(comparableAttributeValue).filter((value): value is string => Boolean(value))
      : [];
    if (!leftValues.length || !rightValues.length) return null;
    return leftValues.some((value) => rightValues.includes(value));
  }

  const leftValue = comparableAttributeValue(left);
  const rightValue = comparableAttributeValue(right);
  if (!leftValue || !rightValue) return null;
  return leftValue === rightValue;
}

function attributeSimilarity(left: Product, right: Product, keys: readonly string[]) {
  const leftAttributes = getEffectiveStyleAttributes(left);
  const rightAttributes = getEffectiveStyleAttributes(right);
  if (!leftAttributes || !rightAttributes) return { score: null, matches: [] as string[] };

  let comparableCount = 0;
  let matchedCount = 0;
  const matches: string[] = [];
  for (const key of keys) {
    const matched = attributeValuesMatch(leftAttributes[key], rightAttributes[key]);
    if (matched === null) continue;
    comparableCount += 1;
    if (matched) {
      matchedCount += 1;
      matches.push(key);
    }
  }

  return {
    score: comparableCount ? matchedCount / comparableCount : null,
    matches,
  };
}

function sameProductCategory(left: Product, right: Product) {
  const leftCategory = String(left.category || "").trim().toLowerCase();
  const rightCategory = String(right.category || "").trim().toLowerCase();
  return Boolean(leftCategory && rightCategory && leftCategory === rightCategory);
}

function weightedProductSimilarity(
  style: number,
  sameCategory: boolean,
  shape: number | null,
  expression: number | null
) {
  const components: Array<[number, number]> = [[style, 0.55], [sameCategory ? 1 : 0, 0.15]];
  if (shape !== null) components.push([shape, 0.15]);
  if (expression !== null) components.push([expression, 0.15]);
  const totalWeight = components.reduce((sum, [, weight]) => sum + weight, 0);
  return components.reduce((sum, [score, weight]) => sum + score * weight, 0) / totalWeight;
}

export function getProductTasteDecision(product: Product, closetProducts: Product[]): ProductTasteDecision | null {
  const productTags = normalizeStyleTags(getEffectiveStyleTags(product).tags);
  const topTags = selectTopTags(productTags, 2, { enforceSecondThreshold: false });
  const eligibleClosetProducts = closetProducts.filter((item) => String(item.id) !== String(product.id));
  const closetSummary = computeTasteSummary(eligibleClosetProducts);
  if (!topTags.length || closetSummary.taggedCount < 3) return null;

  const closetShareByTag = new Map(closetSummary.entries.map((entry) => [entry.tag, entry.percent]));
  const [primaryTag] = topTags[0];
  const secondaryTag = topTags[1]?.[0];
  const closetShare = closetShareByTag.get(primaryTag) || 0;
  const tagEvidence = topTags.map(([tag, productScore]) => ({
    tag,
    productScore,
    closetShare: closetShareByTag.get(tag) || 0,
  }));
  const closestProducts = eligibleClosetProducts
    .map((candidate) => {
      const style = styleSimilarity(product, candidate);
      if (style === null) return null;
      const shape = attributeSimilarity(product, candidate, SHAPE_ATTRIBUTE_KEYS);
      const expression = attributeSimilarity(product, candidate, EXPRESSION_ATTRIBUTE_KEYS);
      const sameCategory = sameProductCategory(product, candidate);
      return {
        product: candidate,
        similarity: weightedProductSimilarity(style, sameCategory, shape.score, expression.score),
        styleSimilarity: style,
        sameCategory,
        shapeSimilarity: shape.score,
        expressionSimilarity: expression.score,
        shapeMatches: shape.matches,
        expressionMatches: expression.matches,
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, 3);
  const closestMatch = closestProducts[0];
  const isStrongOverlap = Boolean(
    closestMatch &&
      closestMatch.sameCategory &&
      closestMatch.styleSimilarity >= 0.86 &&
      (closestMatch.shapeSimilarity ?? 0) >= 0.5 &&
      (closestMatch.expressionSimilarity ?? 0) >= 0.34
  );

  const kind: ProductTasteDecisionKind =
    isStrongOverlap
      ? "overlap"
      : closetShare < 9
        ? "new_direction"
        : "core_match";

  return { kind, primaryTag, secondaryTag, closetShare, tagEvidence, closestProducts };
}

function getEffectiveStyleAttributes(product: Product): Record<string, unknown> | null {
  const hasHumanAttributes = product.humanStyleAttributes && typeof product.humanStyleAttributes === "object" && !Array.isArray(product.humanStyleAttributes);
  if (hasHumanAttributes && (product.tagReviewStatus === "approved" || product.tagReviewStatus === "edited")) {
    return product.humanStyleAttributes as Record<string, unknown>;
  }
  return product.styleAttributes && typeof product.styleAttributes === "object" && !Array.isArray(product.styleAttributes)
    ? product.styleAttributes as Record<string, unknown>
    : null;
}

function averageTagScores(products: Product[]) {
  const totals = Object.fromEntries(TAGS.map((tag) => [tag, 0])) as Record<StyleTagName, number>;
  let count = 0;
  for (const product of products) {
    const tags = normalizeStyleTags(getEffectiveStyleTags(product).tags);
    if (!Object.keys(tags).length) continue;
    count += 1;
    for (const tag of TAGS) totals[tag] += Number(tags[tag] || 0);
  }
  for (const tag of TAGS) totals[tag] /= Math.max(count, 1);
  return totals;
}

export function describeTasteCollection(products: Product[], summary = computeTasteSummary(products)): TasteCollectionInterpretation | null {
  const coreTags = summary.entries.slice(0, 3).map((entry) => entry.tag);
  if (!coreTags.length) return null;

  const tagScores = averageTagScores(products);
  const axes = COLLECTION_AXES
    .map((axis) => {
      const average = (tags: StyleTagName[]) => tags.reduce((sum, tag) => sum + tagScores[tag], 0) / tags.length;
      const score = average(axis.positiveTags) - average(axis.negativeTags);
      return {
        title: axis.title,
        magnitude: Math.abs(score),
        label: score >= 0.06 ? axis.positiveLabel : score <= -0.06 ? axis.negativeLabel : "양쪽 무드가 함께 보임",
      };
    })
    .sort((left, right) => right.magnitude - left.magnitude)
    .slice(0, 2)
    .map(({ title, label }) => ({ title, label }));

  const details = Object.entries(ATTRIBUTE_LABELS).flatMap(([attribute, labels]) => {
    const counts = new Map<string, number>();
    for (const product of products) {
      const value = String(getEffectiveStyleAttributes(product)?.[attribute] || "").trim().toLowerCase();
      if (labels[value]) counts.set(value, (counts.get(value) || 0) + 1);
    }
    const topValue = [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0];
    return topValue ? [labels[topValue]] : [];
  }).slice(0, 3);

  const [primary, secondary] = coreTags;
  const title = secondary
    ? `${TAG_LABELS[primary]}${josa(TAG_LABEL_READINGS[primary], "을", "를")} 중심으로 ${TAG_LABELS[secondary]}${josa(TAG_LABEL_READINGS[secondary], "을", "를")} 더한 취향`
    : `${TAG_LABELS[primary]}${josa(TAG_LABEL_READINGS[primary], "이", "가")} 두드러지는 취향`;
  const summaryCopy = secondary
    ? `${TAG_TASTE_COPY[primary]} 위에 ${TAG_TASTE_COPY[secondary]}${josa(TAG_TASTE_COPY[secondary], "이", "가")} 반복해서 쌓여 있습니다.`
    : `${TAG_TASTE_COPY[primary]}${josa(TAG_TASTE_COPY[primary], "이", "가")} 이 컬렉션에서 가장 자주 나타납니다.`;

  return { title, summary: summaryCopy, coreTags, details, axes };
}
