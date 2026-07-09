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
export const ITEM_COLLAPSED_RADIUS = 14;
export const ITEM_DETAIL_RADIUS = 20;
export const MIN_TAG_RADIUS = 20;
export const MAX_TAG_RADIUS = 42;
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
