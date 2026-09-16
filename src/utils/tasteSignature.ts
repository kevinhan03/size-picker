import type { Product, StyleTagName } from "../types";
import { TAGS } from "./tasteGraph";
import { styleProfileLabels, styleProfileVector } from "./styleProfile";

export const TASTE_SIGNATURE_MIN_ITEMS = 5;
const RECENT_DAYS = 90;
const RECENT_WEIGHT = 1.25;
const CLOSET_WEIGHT = 1.5;

type SignatureAxisId = "mood" | "surface" | "expression" | "time";
type SignatureAxisDirection = "positive" | "negative" | "balanced";

export interface TasteSignature {
  tags: StyleTagName[];
  axes: Array<{ id: SignatureAxisId; direction: SignatureAxisDirection }>;
  details: Array<{ field: "fit_volume" | "silhouette" | "formality" | "utility"; value: string }>;
}

export interface TasteSignaturePresentation {
  title: string;
  tags: string[];
  axes: string[];
  details: string[];
}

const SIGNATURE_AXES: Array<{
  id: SignatureAxisId;
  positiveTags: StyleTagName[];
  negativeTags: StyleTagName[];
}> = [
  { id: "mood", positiveTags: ["classic", "chic_modern"], negativeTags: ["sporty", "workwear", "gorpcore"] },
  { id: "surface", positiveTags: ["minimal", "chic_modern"], negativeTags: ["vintage", "workwear"] },
  { id: "expression", positiveTags: ["minimal", "classic"], negativeTags: ["street", "lovely", "glam_sexy"] },
  { id: "time", positiveTags: ["classic", "vintage"], negativeTags: ["chic_modern", "street", "sporty"] },
];

const ATTRIBUTE_LABELS = {
  fit_volume: {
    slim: ["슬림한 핏", "Slim fit"], regular: ["기본 핏", "Regular fit"], relaxed: ["여유 있는 핏", "Relaxed fit"], oversized: ["오버사이즈", "Oversized"], boxy: ["박시한 비율", "Boxy proportions"],
  },
  silhouette: {
    slim: ["슬림한 실루엣", "Slim silhouette"], straight: ["스트레이트 실루엣", "Straight silhouette"], wide: ["와이드 실루엣", "Wide silhouette"], tapered: ["테이퍼드 실루엣", "Tapered silhouette"], bootcut: ["부츠컷 실루엣", "Bootcut silhouette"], flare: ["플레어 실루엣", "Flare silhouette"], balloon: ["벌룬 실루엣", "Balloon silhouette"], a_line: ["A라인 실루엣", "A-line silhouette"], fit_and_flare: ["핏앤플레어", "Fit and flare"], slip: ["슬립 실루엣", "Slip silhouette"], voluminous: ["볼륨감 있는 실루엣", "Voluminous silhouette"],
  },
  formality: {
    casual: ["일상적인 격식", "Everyday formality"], smart: ["정돈된 캐주얼", "Smart casual"], formal: ["드레스업 가능한 격식", "Dress-up formality"],
  },
  utility: {
    none: ["장식보다 형태 중심", "Form over decoration"], light: ["가벼운 실용 디테일", "Light utility detail"], strong: ["뚜렷한 실용 디테일", "Strong utility detail"],
  },
} as const;

type AttributeField = keyof typeof ATTRIBUTE_LABELS;

function effectiveAttributes(product: Product): Record<string, unknown> | null {
  const human = product.humanStyleAttributes;
  if (human && typeof human === "object" && !Array.isArray(human) && product.factsReviewedAt) return human;
  const ai = product.styleAttributes;
  return ai && typeof ai === "object" && !Array.isArray(ai) ? ai : null;
}

export function tasteSignatureWeight(product: Product, sourceWeight: number, referenceTime: number) {
  const addedAt = Date.parse(product.collectionAddedAt || "");
  const isRecent = Number.isFinite(addedAt) && referenceTime - addedAt <= RECENT_DAYS * 86_400_000;
  return sourceWeight * (isRecent ? RECENT_WEIGHT : 1);
}

/** Produces only aggregate style signals; no item-level data is returned. */
export function createTasteSignature(
  savedProducts: Product[],
  closetProducts: Product[],
  referenceTime = Date.now()
): TasteSignature | null {
  const combined = new Map<string, { product: Product; sourceWeight: number }>();
  for (const product of closetProducts) combined.set(product.id, { product, sourceWeight: CLOSET_WEIGHT });
  for (const product of savedProducts) {
    if (!combined.has(product.id)) combined.set(product.id, { product, sourceWeight: 1 });
  }

  const totals = Object.fromEntries(TAGS.map((tag) => [tag, 0])) as Record<StyleTagName, number>;
  const detailScores = new Map<string, { field: AttributeField; value: string; score: number }>();
  let eligibleCount = 0;

  for (const { product, sourceWeight } of combined.values()) {
    const vector = styleProfileVector(product);
    if (!vector) continue;
    const weight = tasteSignatureWeight(product, sourceWeight, referenceTime);
    eligibleCount += 1;
    for (const tag of TAGS) totals[tag] += vector[tag] * weight;

    const attributes = effectiveAttributes(product);
    if (!attributes) continue;
    for (const field of Object.keys(ATTRIBUTE_LABELS) as AttributeField[]) {
      const value = String(attributes[field] || "").trim().toLowerCase();
      if (!value || !(value in ATTRIBUTE_LABELS[field])) continue;
      const key = `${field}:${value}`;
      const previous = detailScores.get(key);
      detailScores.set(key, { field, value, score: (previous?.score || 0) + weight });
    }
  }

  if (eligibleCount < TASTE_SIGNATURE_MIN_ITEMS) return null;

  const tags = [...TAGS].sort((left, right) => totals[right] - totals[left]).slice(0, 3);
  const axes = SIGNATURE_AXES.map((axis) => {
    const positive = axis.positiveTags.reduce((sum, tag) => sum + totals[tag], 0) / axis.positiveTags.length;
    const negative = axis.negativeTags.reduce((sum, tag) => sum + totals[tag], 0) / axis.negativeTags.length;
    const difference = positive - negative;
    return {
      id: axis.id,
      magnitude: Math.abs(difference),
      direction: difference >= 0.06 ? "positive" as const : difference <= -0.06 ? "negative" as const : "balanced" as const,
    };
  }).sort((left, right) => right.magnitude - left.magnitude).slice(0, 2).map(({ id, direction }) => ({ id, direction }));

  const details: TasteSignature["details"] = [];
  const usedFields = new Set<AttributeField>();
  for (const detail of [...detailScores.values()].sort((left, right) => right.score - left.score || left.field.localeCompare(right.field))) {
    if (usedFields.has(detail.field)) continue;
    usedFields.add(detail.field);
    details.push({ field: detail.field, value: detail.value });
    if (details.length === 3) break;
  }

  return { tags, axes, details };
}

const AXIS_COPY: Record<SignatureAxisId, Record<SignatureAxisDirection, [string, string]>> = {
  mood: { positive: ["정돈된 테일러링", "Refined tailoring"], negative: ["실용적인 디테일", "Functional details"], balanced: ["단정함과 실용성의 조화", "A balance of polish and utility"] },
  surface: { positive: ["매끈하고 깔끔한 소재", "Clean, smooth materials"], negative: ["워싱과 사용감 있는 질감", "Washed, lived-in texture"], balanced: ["깔끔함과 질감의 조화", "A balance of clean and textured"] },
  expression: { positive: ["절제된 포인트", "Restrained accents"], negative: ["존재감 있는 포인트", "Bold accents"], balanced: ["힘을 뺀 포인트", "Balanced accents"] },
  time: { positive: ["헤리티지 디테일", "Heritage details"], negative: ["컨템포러리한 디테일", "Contemporary details"], balanced: ["시대를 타지 않는 디테일", "Timeless details"] },
};

const STYLE_HEADLINE: Record<StyleTagName, [string, string]> = {
  minimal: ["미니멀", "Minimal"],
  street: ["스트릿", "Street"],
  classic: ["클래식", "Classic"],
  vintage: ["빈티지", "Vintage"],
  lovely: ["러블리", "Lovely"],
  sporty: ["스포티", "Sporty"],
  workwear: ["워크웨어", "Workwear"],
  gorpcore: ["고프코어", "Gorpcore"],
  chic_modern: ["시크 모던", "Chic modern"],
  glam_sexy: ["글램", "Glam"],
};

export function presentTasteSignature(signature: TasteSignature, locale: "ko" | "en"): TasteSignaturePresentation {
  const [primary, secondary] = signature.tags;
  const languageIndex = locale === "en" ? 1 : 0;
  const primaryLabel = primary ? STYLE_HEADLINE[primary][languageIndex] : locale === "en" ? "Personal" : "나만의";
  const secondaryLabel = secondary ? STYLE_HEADLINE[secondary][languageIndex] : null;
  return {
    title: locale === "en"
      ? secondaryLabel ? `${primaryLabel} base · ${secondaryLabel} mood` : `${primaryLabel} style`
      : secondaryLabel ? `${primaryLabel} 베이스 · ${secondaryLabel} 무드` : `${primaryLabel} 스타일`,
    tags: signature.tags.map((tag) => styleProfileLabels(tag, locale)),
    axes: signature.axes.map((axis) => AXIS_COPY[axis.id][axis.direction][locale === "en" ? 1 : 0]),
    details: signature.details.map(({ field, value }) => ATTRIBUTE_LABELS[field][value as never]?.[locale === "en" ? 1 : 0] || value),
  };
}
