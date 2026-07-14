import type { Product, ProductTargetGender, StyleTagName, StyleTags } from "../types";
import { getEffectiveStyleTags, normalizeStyleTags, TAGS } from "./tasteGraph";

export type DigMatchChoice = "left" | "right" | "both" | "neither" | "skip";

export interface DigMatchAxis {
  id: string;
  title: string;
  positiveLabel: string;
  negativeLabel: string;
  positiveTags: StyleTagName[];
  negativeTags: StyleTagName[];
}

export type DigMatchPresentation = "menswear" | "womenswear" | "all";

export interface DigMatchQuestion {
  id: string;
  axisId: string;
  axisTitle: string;
  left: Product;
  right: Product;
}

export interface DigMatchAnswer {
  questionId: string;
  axisId: string;
  choice: DigMatchChoice;
  leftProductId: string;
  rightProductId: string;
}

export interface DigMatchSignal {
  score: number;
  confidence: number;
}

export interface DigMatchProfile {
  version: 1;
  completedSessions: number;
  signals: Partial<Record<StyleTagName, DigMatchSignal>>;
  updatedAt: string;
}

export const DIG_MATCH_AXES: DigMatchAxis[] = [
  {
    id: "polished_vs_utility",
    title: "정돈된 무드와 실용적인 무드",
    positiveLabel: "정돈된 구조감",
    negativeLabel: "실용적인 장비감",
    positiveTags: ["classic", "chic_modern"],
    negativeTags: ["casual", "sporty", "workwear_gorpcore"],
  },
  {
    id: "clean_vs_textured",
    title: "클린한 무드와 질감 있는 무드",
    positiveLabel: "깨끗하고 매끈한 인상",
    negativeLabel: "질감과 사용감이 있는 인상",
    positiveTags: ["minimal", "chic_modern"],
    negativeTags: ["vintage", "workwear_gorpcore"],
  },
  {
    id: "restrained_vs_expressive",
    title: "절제된 인상과 표현적인 인상",
    positiveLabel: "절제된 표현",
    negativeLabel: "분명한 존재감",
    positiveTags: ["minimal", "classic"],
    negativeTags: ["street", "lovely_romantic", "glam_sexy"],
  },
  {
    id: "soft_vs_urban",
    title: "부드러운 무드와 도회적인 무드",
    positiveLabel: "부드럽고 유연한 무드",
    negativeLabel: "도시적이고 러기드한 무드",
    positiveTags: ["lovely_romantic"],
    negativeTags: ["street", "workwear_gorpcore"],
  },
  {
    id: "heritage_vs_contemporary",
    title: "헤리티지와 컨템포러리",
    positiveLabel: "시간감 있는 헤리티지",
    negativeLabel: "동시대적인 선명함",
    positiveTags: ["classic", "vintage"],
    negativeTags: ["chic_modern", "street", "sporty"],
  },
];

const PRIMARY_CATEGORY_SEQUENCE = ["Top", "Bottom", "Outer", "Top", "Bottom", "Outer", "Top", "Bottom", "Outer", "Top", "Bottom", "Outer"];

const tagLabels: Record<StyleTagName, string> = {
  casual: "Casual",
  minimal: "Minimal",
  street: "Street",
  classic: "Classic",
  vintage: "Vintage",
  lovely_romantic: "Lovely romantic",
  sporty: "Sporty",
  workwear_gorpcore: "Workwear gorpcore",
  chic_modern: "Chic modern",
  glam_sexy: "Glam sexy",
};

export function getDigMatchTagLabel(tag: StyleTagName) {
  return tagLabels[tag];
}

function scoreAxis(tags: Partial<StyleTags>, axis: DigMatchAxis) {
  const average = (keys: StyleTagName[]) =>
    keys.reduce((sum, tag) => sum + Number(tags[tag] || 0), 0) / Math.max(keys.length, 1);
  return average(axis.positiveTags) - average(axis.negativeTags);
}

function normalizeTargetGender(value: unknown): ProductTargetGender {
  return ["menswear", "womenswear", "unisex", "unknown"].includes(String(value || ""))
    ? String(value) as ProductTargetGender
    : "unknown";
}

function eligibleProducts(products: Product[], presentation: DigMatchPresentation) {
  return products.filter((product) => {
    const tags = normalizeStyleTags(getEffectiveStyleTags(product).tags);
    const targetGender = normalizeTargetGender(product.targetGender);
    const matchesPresentation =
      presentation === "all" || targetGender === presentation || targetGender === "unisex";
    return matchesPresentation && Boolean(product.image || product.thumbnailImage) && Object.values(tags).some((score) => score >= 0.2);
  });
}

export function buildDigMatchQuestions(
  products: Product[],
  count = 12,
  random = Math.random,
  options: { presentation?: DigMatchPresentation } = {}
): DigMatchQuestion[] {
  const candidates = eligibleProducts(products, options.presentation || "all");
  const usedProductIds = new Set<string>();
  const questions: DigMatchQuestion[] = [];

  for (let questionIndex = 0; questionIndex < count; questionIndex += 1) {
    const axis = DIG_MATCH_AXES[questionIndex % DIG_MATCH_AXES.length];
    const plannedCategory = PRIMARY_CATEGORY_SEQUENCE[questionIndex % PRIMARY_CATEGORY_SEQUENCE.length];
    const categoryProducts = candidates.filter(
      (product) => !usedProductIds.has(product.id) && String(product.category || "") === plannedCategory
    );

    let pair: { left: Product; right: Product } | null = null;
    if (categoryProducts.length >= 2) {
      const ranked = categoryProducts
        .map((product) => ({ product, score: scoreAxis(normalizeStyleTags(getEffectiveStyleTags(product).tags), axis) }))
        .sort((a, b) => b.score - a.score);
      // Tag scores are all positive values, so contrast is meaningful by relative distance,
      // not only when one product's axis score crosses below zero.
      const high = ranked.slice(0, 5);
      const low = ranked.slice(-5);
      if (!high.length || !low.length || high[0].score - low[low.length - 1].score < 0.08) continue;
      const left = high[Math.floor(random() * high.length)].product;
      const right = low[Math.floor(random() * low.length)].product;
      if (left.id !== right.id) {
        pair = random() >= 0.5 ? { left, right } : { left: right, right: left };
      }
    }
    if (!pair) break;
    usedProductIds.add(pair.left.id);
    usedProductIds.add(pair.right.id);
    questions.push({
      id: `match-${questionIndex + 1}-${pair.left.id}-${pair.right.id}`,
      axisId: axis.id,
      axisTitle: axis.title,
      left: pair.left,
      right: pair.right,
    });
  }
  return questions;
}

function productTags(product: Product) {
  return normalizeStyleTags(getEffectiveStyleTags(product).tags);
}

function addProductSignal(target: Record<StyleTagName, number>, product: Product, multiplier: number) {
  const tags = productTags(product);
  for (const tag of TAGS) target[tag] += Number(tags[tag] || 0) * multiplier;
}

export function calculateDigMatchProfile(
  previous: DigMatchProfile | null,
  questions: DigMatchQuestion[],
  answers: DigMatchAnswer[]
): DigMatchProfile {
  const productById = new Map(questions.flatMap((question) => [question.left, question.right]).map((product) => [product.id, product]));
  const sessionSignal = Object.fromEntries(TAGS.map((tag) => [tag, 0])) as Record<StyleTagName, number>;
  const sessionEvidence = Object.fromEntries(TAGS.map((tag) => [tag, 0])) as Record<StyleTagName, number>;

  for (const answer of answers) {
    const left = productById.get(answer.leftProductId);
    const right = productById.get(answer.rightProductId);
    if (!left || !right || answer.choice === "skip") continue;
    if (answer.choice === "left" || answer.choice === "right") {
      const selected = answer.choice === "left" ? left : right;
      addProductSignal(sessionSignal, selected, 1);
      for (const tag of TAGS) sessionEvidence[tag] += Number(productTags(selected)[tag] || 0);
    } else if (answer.choice === "both") {
      addProductSignal(sessionSignal, left, 0.5);
      addProductSignal(sessionSignal, right, 0.5);
      for (const tag of TAGS) sessionEvidence[tag] += (Number(productTags(left)[tag] || 0) + Number(productTags(right)[tag] || 0)) * 0.5;
    } else if (answer.choice === "neither") {
      addProductSignal(sessionSignal, left, -0.2);
      addProductSignal(sessionSignal, right, -0.2);
    }
  }

  const maxSignal = Math.max(1, ...TAGS.map((tag) => Math.abs(sessionSignal[tag])));
  const priorSessions = Math.max(0, Number(previous?.completedSessions || 0));
  const sessions = priorSessions + 1;
  const signals: Partial<Record<StyleTagName, DigMatchSignal>> = {};
  for (const tag of TAGS) {
    const current = Math.max(-1, Math.min(1, sessionSignal[tag] / maxSignal));
    const prior = previous?.signals?.[tag];
    const score = prior ? prior.score * 0.7 + current * 0.3 : current;
    const confidence = Math.min(1, (prior?.confidence || 0) * 0.75 + Math.min(0.55, sessionEvidence[tag] * 0.22));
    signals[tag] = { score: Math.max(-1, Math.min(1, score)), confidence };
  }

  return { version: 1, completedSessions: sessions, signals, updatedAt: new Date().toISOString() };
}

export function getDigMatchHighlights(profile: DigMatchProfile) {
  const ranked = TAGS.map((tag) => ({ tag, ...(profile.signals[tag] || { score: 0, confidence: 0 }) })).sort(
    (a, b) => b.score * b.confidence - a.score * a.confidence
  );
  return {
    core: ranked.filter((item) => item.score > 0.15 && item.confidence >= 0.35).slice(0, 3),
    signature: ranked.filter((item) => item.score > 0.05).slice(0, 3),
    curious: ranked.filter((item) => item.score > 0.12 && item.confidence < 0.35).slice(0, 2),
  };
}

export function getDigMatchRecommendations(products: Product[], profile: DigMatchProfile, excludedIds: Set<string>, count = 3, presentation: DigMatchPresentation = "all") {
  return eligibleProducts(products, presentation)
    .filter((product) => !excludedIds.has(product.id))
    .map((product) => {
      const tags = productTags(product);
      const score = TAGS.reduce((sum, tag) => sum + Number(tags[tag] || 0) * Math.max(0, profile.signals[tag]?.score || 0), 0);
      const reasons = TAGS.filter((tag) => Number(tags[tag] || 0) >= 0.35 && (profile.signals[tag]?.score || 0) > 0.1)
        .sort((a, b) => Number(tags[b] || 0) - Number(tags[a] || 0))
        .slice(0, 2);
      return { product, score, reasons };
    })
    .filter((item) => item.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

const TAG_INTERPRETATIONS: Record<StyleTagName, string> = {
  casual: "편안하지만 무드가 흐려지지 않는 데일리함",
  minimal: "불필요한 장식보다 정돈된 형태",
  street: "도시적이고 분명한 유스 컬처의 존재감",
  classic: "오래 입을 수 있는 단정한 구조",
  vintage: "시간이 쌓인 듯한 질감과 과거의 결",
  lovely_romantic: "부드러운 곡선과 섬세한 장식",
  sporty: "활동성과 스포츠에서 온 리듬",
  workwear_gorpcore: "실용적인 디테일과 러기드한 기능성",
  chic_modern: "도시적이고 날카로운 현대적 긴장감",
  glam_sexy: "몸선과 드레스업을 의식한 화려한 인상",
};

function effectiveAttributes(product: Product) {
  const hasHumanAttributes = product.humanStyleAttributes && typeof product.humanStyleAttributes === "object" && !Array.isArray(product.humanStyleAttributes);
  return hasHumanAttributes && (product.tagReviewStatus === "approved" || product.tagReviewStatus === "edited")
    ? product.humanStyleAttributes as Record<string, unknown>
    : product.styleAttributes as Record<string, unknown> | null;
}

function selectedProducts(questions: DigMatchQuestion[], answers: DigMatchAnswer[]) {
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const selected: Product[] = [];
  for (const answer of answers) {
    const question = questionById.get(answer.questionId);
    if (!question) continue;
    if (answer.choice === "left") selected.push(question.left);
    if (answer.choice === "right") selected.push(question.right);
    if (answer.choice === "both") selected.push(question.left, question.right);
  }
  return selected;
}

export function getDigMatchInterpretation(profile: DigMatchProfile, questions: DigMatchQuestion[], answers: DigMatchAnswer[]) {
  const highlights = getDigMatchHighlights(profile);
  const top = highlights.signature.slice(0, 2);
  const selected = selectedProducts(questions, answers);
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const axisValues = new Map<string, number[]>();
  for (const answer of answers) {
    const question = questionById.get(answer.questionId);
    if (!question || answer.choice === "skip" || answer.choice === "neither") continue;
    const choices = answer.choice === "left" ? [question.left] : answer.choice === "right" ? [question.right] : [question.left, question.right];
    const axis = DIG_MATCH_AXES.find((item) => item.id === question.axisId);
    if (!axis) continue;
    const values = axisValues.get(axis.id) || [];
    values.push(...choices.map((product) => scoreAxis(productTags(product), axis)));
    axisValues.set(axis.id, values);
  }
  const axes = DIG_MATCH_AXES.map((axis) => {
    const values = axisValues.get(axis.id) || [];
    const score = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
    return { axis, score, label: score >= 0.08 ? axis.positiveLabel : score <= -0.08 ? axis.negativeLabel : "양쪽 무드를 함께 탐색 중" };
  }).sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 3);

  const attributeLabels: Record<string, Record<string, string>> = {
    fit: { relaxed: "여유 있는 핏", wide: "와이드한 비율", slim: "몸에 가까운 핏", straight: "곧은 비율", tapered: "정리된 테이퍼드 핏" },
    silhouette: { clean: "깨끗한 실루엣", structured: "구조적인 실루엣", loose: "느슨한 실루엣", voluminous: "볼륨 있는 실루엣", draped: "흐르는 실루엣" },
    formality: { casual: "일상적인 격식", "smart-casual": "정돈된 캐주얼", formal: "드레스업 가능한 격식" },
    utility_level: { none: "장식보다 형태 중심", light: "가벼운 실용 디테일", strong: "뚜렷한 실용 디테일" },
  };
  const details = Object.entries(attributeLabels).flatMap(([key, labels]) => {
    const counts = new Map<string, number>();
    for (const product of selected) {
      const value = String(effectiveAttributes(product)?.[key] || "").trim().toLowerCase();
      if (labels[value]) counts.set(value, (counts.get(value) || 0) + 1);
    }
    const topValue = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return topValue ? [labels[topValue]] : [];
  }).slice(0, 3);

  const title = top.length >= 2
    ? `${getDigMatchTagLabel(top[0].tag)}을 중심으로 ${getDigMatchTagLabel(top[1].tag)}의 결을 더하는 취향`
    : "선택이 쌓이며 취향의 중심을 찾는 중";
  const summary = top.length
    ? `이번 선택에서는 ${top.map((item) => TAG_INTERPRETATIONS[item.tag]).join("과 ")}이 반복해서 나타났습니다.`
    : "이번 선택을 바탕으로 다음 매치에서 취향의 중심을 더 또렷하게 잡아갈 수 있습니다.";
  return { title, summary, axes, details, selectedCount: selected.length };
}

export function parseDigMatchProfile(value: unknown): DigMatchProfile | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Partial<DigMatchProfile>;
  if (!raw.signals || typeof raw.signals !== "object") return null;
  const signals: Partial<Record<StyleTagName, DigMatchSignal>> = {};
  for (const tag of TAGS) {
    const item = raw.signals[tag];
    if (!item || typeof item !== "object") continue;
    const score = Number((item as DigMatchSignal).score);
    const confidence = Number((item as DigMatchSignal).confidence);
    if (Number.isFinite(score) && Number.isFinite(confidence)) signals[tag] = { score, confidence };
  }
  return {
    version: 1,
    completedSessions: Math.max(0, Number(raw.completedSessions || 0)),
    signals,
    updatedAt: String(raw.updatedAt || ""),
  };
}
