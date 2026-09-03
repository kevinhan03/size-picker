import type { Product, StyleAxes, StyleProfile, StyleProfileKey } from "../types";
import { STYLE_AXIS_FIELDS, STYLE_PROTOTYPE_CENTERS } from "../constants/styleAnalysis.js";

// v2 excludes female-only style centres unless the product is targeted at women.
export const STYLE_PROFILE_VERSION = "centers-v2-gender";
export const STYLE_PROFILE_TEMPERATURE = 3.606;
export const STYLE_PROFILE_DISPLAY_COUNT = 3;

const AXIS_KEYS = STYLE_AXIS_FIELDS.map((field: { key: string }) => field.key) as Array<keyof StyleAxes>;
const PROFILE_KEYS = STYLE_PROTOTYPE_CENTERS.map((center: { key: string }) => center.key) as StyleProfileKey[];
const WOMENS_STYLE_KEYS = new Set<StyleProfileKey>(["lovely", "glam_sexy"]);

export type StyleProfileSource = "human" | "ai";

export interface StyleProfileEntry {
  key: StyleProfileKey;
  score: number;
  distance: number;
  rank: number;
}

export interface ProductStyleProfile {
  version: typeof STYLE_PROFILE_VERSION;
  source: StyleProfileSource;
  axes: StyleAxes;
  entries: StyleProfileEntry[];
  displayEntries: StyleProfileEntry[];
  title: string;
  description: string;
}

function axisScore(value: unknown): number | null {
  const raw = value && typeof value === "object" && !Array.isArray(value)
    ? (value as { score?: unknown }).score
    : value;
  const score = Number(raw);
  return Number.isInteger(score) && score >= 1 && score <= 7 ? score : null;
}

export function normalizeStyleAxes(value: unknown): StyleAxes | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result = {} as StyleAxes;
  for (const key of AXIS_KEYS) {
    const score = axisScore((value as Record<string, unknown>)[key]);
    if (score === null) return null;
    result[key] = score;
  }
  return result;
}

export function getEffectiveStyleAxes(product: Product): { axes: StyleAxes; source: StyleProfileSource } | null {
  const human = normalizeStyleAxes(product.humanStyleAxes);
  if (human && product.styleAxesReviewedAt) return { axes: human, source: "human" };
  const ai = normalizeStyleAxes(product.styleAxes);
  return ai ? { axes: ai, source: "ai" } : null;
}

/**
 * The admin-reviewed value takes precedence. Lovely and glam-sexy are only
 * candidate centres for products explicitly targeted at womenswear; this
 * prevents menswear, unisex, and unreviewed products from being assigned a
 * female-coded tag merely because it is the nearest available centre.
 */
export function eligibleStyleProfileKeys(product: Product): StyleProfileKey[] {
  const reviewedGender = String(product.humanTargetGender || "").trim().toLowerCase();
  const inferredGender = String(product.targetGender || "").trim().toLowerCase();
  const targetGender = reviewedGender || inferredGender;
  return targetGender === "womenswear"
    ? PROFILE_KEYS
    : PROFILE_KEYS.filter((key) => !WOMENS_STYLE_KEYS.has(key));
}

export function styleProfileLabels(key: StyleProfileKey, locale = "ko") {
  const labels: Record<StyleProfileKey, { ko: string; en: string }> = {
    minimal: { ko: "미니멀", en: "Minimal" },
    street: { ko: "스트릿", en: "Street" },
    classic: { ko: "클래식", en: "Classic" },
    vintage: { ko: "빈티지", en: "Vintage" },
    lovely: { ko: "러블리", en: "Lovely" },
    sporty: { ko: "스포티", en: "Sporty" },
    workwear: { ko: "워크웨어", en: "Workwear" },
    gorpcore: { ko: "고프코어", en: "Gorpcore" },
    chic_modern: { ko: "시크 모던", en: "Chic modern" },
    glam_sexy: { ko: "글램섹시", en: "Glam sexy" },
  };
  return labels[key][locale === "en" ? "en" : "ko"];
}

function displayTitle(entries: StyleProfileEntry[]) {
  const [first, second, third] = entries;
  if (!first || !second || !third) return "스타일 성향";
  if (first.score - third.score <= 12) return "복합 스타일";
  if (second.score >= 30 && first.score - second.score <= 25) {
    return `${styleProfileLabels(first.key)} ${styleProfileLabels(second.key)}`;
  }
  return `${styleProfileLabels(first.key)} 무드`;
}

function displayDescription(entries: StyleProfileEntry[]) {
  const [first, second, third] = entries;
  if (!first || !second || !third) return "";
  if (first.score - third.score <= 12) return "여러 스타일이 비슷하게 섞여 한 가지 무드로 단정하지 않았어요.";
  if (second.score >= 30 && first.score - second.score <= 25) {
    return `${styleProfileLabels(first.key)}와 ${styleProfileLabels(second.key)}의 인상이 함께 읽히는 상품이에요.`;
  }
  return `${styleProfileLabels(first.key)} 중심점에 가장 가깝게 읽히는 상품이에요.`;
}

function roundedTopThree(entries: StyleProfileEntry[]) {
  const total = entries.reduce((sum, entry) => sum + entry.score, 0) || 1;
  const exact = entries.map((entry) => (entry.score / total) * 100);
  const rounded = exact.map(Math.floor);
  let remainder = 100 - rounded.reduce((sum, value) => sum + value, 0);
  exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((left, right) => right.fraction - left.fraction || left.index - right.index)
    .forEach(({ index }) => {
      if (remainder > 0) {
        rounded[index] += 1;
        remainder -= 1;
      }
    });
  return entries.map((entry, index) => ({ ...entry, score: rounded[index] }));
}

export function calculateStyleProfile(
  axes: StyleAxes,
  source: StyleProfileSource,
  candidateKeys: readonly StyleProfileKey[] = PROFILE_KEYS
): ProductStyleProfile {
  const candidateKeySet = new Set(candidateKeys);
  const entries = STYLE_PROTOTYPE_CENTERS.filter((center) => candidateKeySet.has(center.key as StyleProfileKey)).map((center) => {
    const distance = Math.sqrt(AXIS_KEYS.reduce((sum, key) => sum + Math.pow(axes[key] - Number(center.axes[key]), 2), 0));
    return { key: center.key as StyleProfileKey, distance, score: Math.exp(-(distance * distance) / (2 * STYLE_PROFILE_TEMPERATURE * STYLE_PROFILE_TEMPERATURE)), rank: 0 };
  })
    .sort((left, right) => left.distance - right.distance || PROFILE_KEYS.indexOf(left.key) - PROFILE_KEYS.indexOf(right.key))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
  const displayEntries = roundedTopThree(entries.slice(0, STYLE_PROFILE_DISPLAY_COUNT));
  return {
    version: STYLE_PROFILE_VERSION,
    source,
    axes,
    entries,
    displayEntries,
    title: displayTitle(displayEntries),
    description: displayDescription(displayEntries),
  };
}

export function getProductStyleProfile(product: Product): ProductStyleProfile | null {
  const effective = getEffectiveStyleAxes(product);
  return effective
    ? calculateStyleProfile(effective.axes, effective.source, eligibleStyleProfileKeys(product))
    : null;
}

export function styleProfileVector(product: Product): StyleProfile | null {
  const profile = getProductStyleProfile(product);
  if (!profile) return null;
  const total = profile.entries.reduce((sum, entry) => sum + entry.score, 0) || 1;
  return Object.fromEntries(PROFILE_KEYS.map((key) => {
    const entry = profile.entries.find((candidate) => candidate.key === key);
    return [key, entry ? entry.score / total : 0];
  })) as StyleProfile;
}
