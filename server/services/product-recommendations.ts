import type { Product } from "../../src/types";
import {
  getCrossCategoryStyleSimilarity,
  getEffectiveProductTargetGender,
  getProductRecommendationSimilarity,
  hasSharedPrimaryStyleTag,
} from "../../src/utils/tasteGraph";

const MIN_VISIBLE_PRODUCTS = 4;
const MAX_VISIBLE_PRODUCTS = 24;
const MIN_QUALITY_SCORE = 0.54;
const NATURAL_SCORE_GAP = 0.075;
const STYLE_TIE_BAND = 0.025;
const STYLE_FALLBACK_MIN_TAG_SIMILARITY = 0.55;
const STYLE_CATEGORIES = new Set(["top", "bottom", "outer", "shoes"]);

type ScoredProduct = { product: Product; similarity: number };

const normalizeCategory = (category: string | null | undefined) => String(category || "").trim().toLowerCase();

const selectNatural = (candidates: ScoredProduct[]) => {
  const qualified = candidates.filter(({ similarity }) => similarity >= MIN_QUALITY_SCORE);
  const visible = (qualified.length >= MIN_VISIBLE_PRODUCTS ? qualified : candidates).slice(0, MAX_VISIBLE_PRODUCTS);
  for (let index = MIN_VISIBLE_PRODUCTS; index < visible.length; index += 1) {
    const previous = visible[index - 1].similarity;
    const current = visible[index].similarity;
    if (previous - current >= NATURAL_SCORE_GAP && current < previous * 0.91) {
      return visible.slice(0, index).map(({ product }) => product);
    }
  }
  return visible.map(({ product }) => product);
};

const compatibleGender = (source: Product, candidate: Product) => {
  const sourceGender = getEffectiveProductTargetGender(source);
  const candidateGender = getEffectiveProductTargetGender(candidate);
  return sourceGender === "unknown" || candidateGender === "unknown" || sourceGender === candidateGender || sourceGender === "unisex" || candidateGender === "unisex";
};

const diversifyCategories = (candidates: ScoredProduct[]) => {
  const result: ScoredProduct[] = [];
  let index = 0;
  while (index < candidates.length) {
    const bandStart = index;
    const bandScore = candidates[index].similarity;
    while (index < candidates.length && bandScore - candidates[index].similarity <= STYLE_TIE_BAND) index += 1;
    const remaining = candidates.slice(bandStart, index);
    const seen = new Set<string>();
    while (remaining.length) {
      const nextIndex = remaining.findIndex(({ product }) => !seen.has(normalizeCategory(product.category)));
      const [next] = remaining.splice(nextIndex >= 0 ? nextIndex : 0, 1);
      result.push(next);
      seen.add(normalizeCategory(next.product.category));
    }
  }
  return result;
};

export const buildProductRecommendations = (source: Product, products: Product[], visualScores = new Map<string, number>()) => {
  const sourceCategory = normalizeCategory(source.category);
  const similarCandidates = products
    .filter((candidate) => candidate.id !== source.id && normalizeCategory(candidate.category) === sourceCategory)
    .map((candidate) => {
      const visualScore = visualScores.get(candidate.id);
      if (typeof visualScore !== "number" || hasSharedPrimaryStyleTag(source, candidate) === false) return null;
      const similarity = getProductRecommendationSimilarity(source, candidate, visualScore);
      return !similarity || similarity.visualSimilarity === null ? null : { product: candidate, similarity: similarity.score };
    })
    .filter((candidate): candidate is ScoredProduct => candidate !== null)
    .sort((left, right) => right.similarity - left.similarity);

  const strict: ScoredProduct[] = [];
  const fallback: ScoredProduct[] = [];
  if (STYLE_CATEGORIES.has(sourceCategory)) {
    for (const candidate of products) {
      const category = normalizeCategory(candidate.category);
      if (candidate.id === source.id || !STYLE_CATEGORIES.has(category) || category === sourceCategory || !compatibleGender(source, candidate)) continue;
      const similarity = getCrossCategoryStyleSimilarity(source, candidate, visualScores.get(candidate.id));
      if (!similarity) continue;
      const scored = { product: candidate, similarity: similarity.score };
      if (hasSharedPrimaryStyleTag(source, candidate) === true) strict.push(scored);
      else if ((similarity.styleSimilarity ?? 0) >= STYLE_FALLBACK_MIN_TAG_SIMILARITY) fallback.push(scored);
    }
  }
  strict.sort((left, right) => right.similarity - left.similarity);
  fallback.sort((left, right) => right.similarity - left.similarity);
  const styleCandidates = strict.length >= MIN_VISIBLE_PRODUCTS
    ? strict
    : [...strict, ...fallback.slice(0, MIN_VISIBLE_PRODUCTS - strict.length)];

  return {
    similarProducts: visualScores.size && sourceCategory ? selectNatural(similarCandidates) : [],
    styleProducts: selectNatural(diversifyCategories(styleCandidates)),
  };
};
