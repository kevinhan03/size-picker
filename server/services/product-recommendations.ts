import type { Product } from "../../src/types";
import { unstable_cache } from "next/cache";
import { SUPABASE_PRODUCTS_TABLE } from "../config/env.js";
import { assertSupabaseConfig, supabase } from "../lib/supabase.js";
import { RECOMMENDATION_COLUMNS, normalizeAnalysisProduct, normalizeProductCard } from "./catalog";
import {
  getCrossCategoryStyleSimilarity,
  getEffectiveProductTargetGender,
  getProductRecommendationSimilarity,
  isOutfitCategoryPair,
} from "../../src/utils/tasteGraph";

const MIN_VISIBLE_PRODUCTS = 4;
const MAX_VISIBLE_PRODUCTS = 24;
const MIN_QUALITY_SCORE = 0.54;
const NATURAL_SCORE_GAP = 0.075;
const STYLE_TIE_BAND = 0.025;
const STYLE_FALLBACK_MIN_TAG_SIMILARITY = 0.55;
const STYLE_CATEGORIES = new Set(["top", "bottom", "outer", "dressskirt", "shoes"]);

export type RecommendationDiagnostics = {
  algorithmVersion: "recommendations-v9";
  score: number;
  reasonCodes: string[];
  components: Record<string, number | null>;
};
type ScoredProduct = { product: Product; similarity: number; diagnostics: RecommendationDiagnostics };

const normalizeCategory = (category: string | null | undefined) => String(category || "").trim().toLowerCase();

const selectNatural = (candidates: ScoredProduct[]) => {
  const qualified = candidates.filter(({ similarity }) => similarity >= MIN_QUALITY_SCORE);
  const visible = (qualified.length >= MIN_VISIBLE_PRODUCTS ? qualified : candidates).slice(0, MAX_VISIBLE_PRODUCTS);
  for (let index = MIN_VISIBLE_PRODUCTS; index < visible.length; index += 1) {
    const previous = visible[index - 1].similarity;
    const current = visible[index].similarity;
    if (previous - current >= NATURAL_SCORE_GAP && current < previous * 0.91) {
      return visible.slice(0, index);
    }
  }
  return visible;
};

const diversifySimilarProducts = (candidates: ScoredProduct[]) => {
  const selected: ScoredProduct[] = [];
  let previousBrand: string | null = null;
  let previousSubCategory: string | null = null;
  let brandStreak = 0;
  let subCategoryStreak = 0;
  for (const candidate of candidates) {
    const brand = String(candidate.product.brand || "").trim().toLowerCase() || null;
    const subCategory = String(candidate.product.subCategory || "").trim().toLowerCase() || null;
    const nextBrandStreak = brand && brand === previousBrand ? brandStreak + 1 : brand ? 1 : 0;
    const nextSubCategoryStreak = subCategory && subCategory === previousSubCategory ? subCategoryStreak + 1 : subCategory ? 1 : 0;
    if (nextBrandStreak > 2 || nextSubCategoryStreak > 2) continue;
    selected.push(candidate);
    previousBrand = brand;
    previousSubCategory = subCategory;
    brandStreak = nextBrandStreak;
    subCategoryStreak = nextSubCategoryStreak;
  }
  return selected;
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
  const categoryCounts = new Map<string, number>();
  return result.filter(({ product }) => {
    const category = normalizeCategory(product.category);
    const count = categoryCounts.get(category) || 0;
    if (count >= 2) return false;
    categoryCounts.set(category, count + 1);
    return true;
  });
};

export const buildProductRecommendations = (source: Product, products: Product[], visualScores = new Map<string, number>()) => {
  const sourceCategory = normalizeCategory(source.category);
  const similarCandidates = products
    .filter((candidate) => candidate.id !== source.id && normalizeCategory(candidate.category) === sourceCategory)
    .map((candidate): ScoredProduct | null => {
      const visualScore = visualScores.get(candidate.id);
      if ((visualScores.size && typeof visualScore !== "number")) return null;
      const similarity = getProductRecommendationSimilarity(source, candidate, visualScore);
      return !similarity || similarity.visualSimilarity === null ? null : {
        product: candidate, similarity: similarity.score,
        diagnostics: { algorithmVersion: "recommendations-v9", score: similarity.score, reasonCodes: ["same_category", "visual_similarity", "style_profile"], components: { visual: similarity.visualSimilarity, style: similarity.styleSimilarity, silhouette: similarity.shapeSimilarity, expression: similarity.expressionSimilarity } },
      };
    })
    .filter((candidate): candidate is ScoredProduct => candidate !== null)
    .sort((left, right) => right.similarity - left.similarity);

  const strict: ScoredProduct[] = [];
  const fallback: ScoredProduct[] = [];
  if (STYLE_CATEGORIES.has(sourceCategory)) {
    for (const candidate of products) {
      const category = normalizeCategory(candidate.category);
      if (candidate.id === source.id || !STYLE_CATEGORIES.has(category) || !compatibleGender(source, candidate) || !isOutfitCategoryPair(source, candidate)) continue;
      const similarity = getCrossCategoryStyleSimilarity(source, candidate, visualScores.get(candidate.id));
      if (!similarity) continue;
      const scored: ScoredProduct = { product: candidate, similarity: similarity.score,
        diagnostics: { algorithmVersion: "recommendations-v9" as const, score: similarity.score, reasonCodes: ["outfit_category_pair", "style_profile", "outfit_harmony"], components: similarity.recommendationComponents || { style: similarity.styleSimilarity, silhouette: similarity.shapeSimilarity, visual: similarity.visualSimilarity } } };
      if ((similarity.styleSimilarity ?? 0) >= STYLE_FALLBACK_MIN_TAG_SIMILARITY) strict.push(scored);
      else fallback.push(scored);
    }
  }
  strict.sort((left, right) => right.similarity - left.similarity);
  fallback.sort((left, right) => right.similarity - left.similarity);
  const styleCandidates = [...strict, ...fallback]
    .sort((left, right) => right.similarity - left.similarity);

  return {
    similarProducts: sourceCategory ? selectNatural(diversifySimilarProducts(similarCandidates)) : [],
    styleProducts: selectNatural(diversifyCategories(styleCandidates)),
  };
};

type CandidateRow = {
  product?: unknown;
  visual_similarity?: number | string | null;
};

async function queryLegacyRecommendationCandidates(productId: string) {
  const { data: legacyRows, error: legacyError } = await supabase!.rpc("get_product_recommendation_candidates", {
    source_product_id: Number(productId),
    candidate_limit: 60,
  });
  if (legacyError) throw legacyError;

  const visualScores = new Map<string, number>();
  for (const row of (legacyRows || []) as Array<{ id?: string | number; visual_similarity?: number | string }>) {
    const id = String(row.id || "");
    const score = Number(row.visual_similarity);
    if (id && Number.isFinite(score)) visualScores.set(id, score);
  }
  if (!visualScores.size) return { rows: [] as unknown[], visualScores };

  const { data, error } = await supabase!
    .from(SUPABASE_PRODUCTS_TABLE)
    .select(RECOMMENDATION_COLUMNS)
    .in("id", [...visualScores.keys()]);
  if (error) throw error;
  return { rows: Array.isArray(data) ? data : [], visualScores };
}

async function queryProductRecommendationData(productId: string) {
  assertSupabaseConfig();
  const { data: sourceRow, error: sourceError } = await supabase!
    .from(SUPABASE_PRODUCTS_TABLE)
    .select(RECOMMENDATION_COLUMNS)
    .eq("id", productId)
    .maybeSingle();
  if (sourceError) throw sourceError;

  const source = normalizeAnalysisProduct(sourceRow);
  if (!source) return null;

  const { data: candidateRows, error: candidateError } = await supabase!.rpc("get_product_recommendation_candidates_v2", {
    source_product_id: Number(productId),
    similar_limit: 120,
    style_limit: 0,
  });

  const visualScores = new Map<string, number>();
  const byId = new Map<string, unknown>();
  if (candidateError?.code === "PGRST202") {
    const legacy = await queryLegacyRecommendationCandidates(productId);
    for (const row of legacy.rows) {
      const id = String((row as { id?: unknown }).id || "");
      if (id) byId.set(id, row);
    }
    for (const [id, score] of legacy.visualScores) visualScores.set(id, score);
  } else {
    if (candidateError) throw candidateError;
    for (const row of (candidateRows || []) as CandidateRow[]) {
      const product = row.product;
      const id = String((product as { id?: unknown } | null)?.id || "");
      if (!id) continue;
      byId.set(id, product);
      const score = Number(row.visual_similarity);
      if (Number.isFinite(score)) visualScores.set(id, score);
    }
  }
  byId.set(source.id, sourceRow);
  const candidates: Product[] = [...byId.values()]
    .map(normalizeAnalysisProduct)
    .filter((product): product is NonNullable<typeof product> => Boolean(product));
  const scoredSource = candidates.find((product: Product) => product.id === source.id) || source;
  const recommendations = buildProductRecommendations(scoredSource, candidates, visualScores);
  const toCard = (scored: ScoredProduct) => {
    const product = normalizeProductCard(byId.get(scored.product.id));
    return product ? { ...product, recommendation: scored.diagnostics } : null;
  };
  return {
    sourceProduct: normalizeProductCard(sourceRow),
    similarProducts: recommendations.similarProducts.map(toCard).filter((product): product is NonNullable<typeof product> => Boolean(product)),
    styleProducts: recommendations.styleProducts.map(toCard).filter((product): product is NonNullable<typeof product> => Boolean(product)),
  };
}

export const getProductRecommendationData = (productId: string) => unstable_cache(
  () => queryProductRecommendationData(productId),
  ["product-recommendations-v9", productId],
  { revalidate: 300, tags: ["recommendations", `recommendations:${productId}`] },
)();
