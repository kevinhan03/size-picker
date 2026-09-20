import type { Product, StyleAxes } from "../../../src/types";
import { supabase } from "../../lib/supabase.js";
import { normalizeAnalysisProduct, RECOMMENDATION_COLUMNS } from "../catalog";
import { axisSimilarity, meanAxes } from "./engine";

export type FeedbackProfile = {
  positiveAxes: Partial<StyleAxes>;
  negativeAxes: Partial<StyleAxes>;
  total: number;
  actionableTotal: number;
  reasons: Record<string, number>;
};
export const emptyFeedbackProfile = (): FeedbackProfile => ({
  positiveAxes: {},
  negativeAxes: {},
  total: 0,
  actionableTotal: 0,
  reasons: {},
});
export function summarizeFeedback(
  rows: Array<{ product_id: string; sentiment: string; reason: string | null }>,
  products: Product[]
): FeedbackProfile {
  const byId = new Map(products.map((product) => [product.id, product]));
  const positive: Product[] = [],
    negative: Product[] = [],
    reasons: Record<string, number> = {};
  for (const row of rows) {
    const product = byId.get(String(row.product_id));
    if (product && row.sentiment === "positive") positive.push(product);
    // A condition miss or an already-owned look is not evidence that the
    // product's style is disliked. Only explicit taste rejection contributes
    // to the negative style centroid.
    if (product && row.reason === "not_my_taste") negative.push(product);
    if (row.reason) reasons[row.reason] = (reasons[row.reason] || 0) + 1;
  }
  const actionableTotal =
    positive.length +
    (reasons.not_my_taste || 0) +
    (reasons.too_plain || 0) +
    (reasons.too_bold || 0) +
    (reasons.too_similar || 0);
  return {
    positiveAxes: meanAxes(positive),
    negativeAxes: meanAxes(negative),
    total: rows.length,
    actionableTotal,
    reasons,
  };
}
export function feedbackAdjustment(
  product: Product,
  profile: FeedbackProfile,
  novelty = 0
): number {
  if (profile.total < 3 || profile.actionableTotal < 3) return 0;
  const positive = axisSimilarity(product, profile.positiveAxes),
    negative = axisSimilarity(product, profile.negativeAxes);
  const axes = product.styleAxes;
  const boldness = axes
    ? ((axes.visual_boldness - 1) / 6 + (axes.unconventionality - 1) / 6) / 2
    : 0.5;
  const repeatedPlain = Math.min(1, (profile.reasons.too_plain || 0) / 3);
  const repeatedBold = Math.min(1, (profile.reasons.too_bold || 0) / 3);
  const repeatedSimilar = Math.min(1, (profile.reasons.too_similar || 0) / 3);
  const raw =
    0.12 * ((positive ?? 0) - (negative ?? 0)) +
    0.08 * (boldness - 0.5) * (repeatedPlain - repeatedBold) +
    0.06 * (novelty - 0.5) * repeatedSimilar;
  // Three observations activate shadow evaluation, while ten are needed for
  // the full (still bounded) adjustment. This prevents one-off reactions from
  // dominating ranking.
  const confidence = Math.min(1, profile.actionableTotal / 10);
  return Math.max(-0.12, Math.min(0.12, raw * confidence));
}
export async function getFeedbackProfile(
  userId: string
): Promise<FeedbackProfile> {
  if (!supabase) return emptyFeedbackProfile();
  const { data, error } = await supabase
    .from("fashion_agent_feedback")
    .select("product_id,sentiment,reason")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) {
    if (
      error.code === "42P01" ||
      /fashion_agent_feedback/i.test(error.message || "")
    )
      return emptyFeedbackProfile();
    throw error;
  }
  const rows = data || [],
    ids = rows
      .map((row) => String(row.product_id))
      .filter((id) => /^\d+$/.test(id));
  if (!ids.length) return emptyFeedbackProfile();
  const { data: products, error: productError } = await supabase
    .from("products")
    .select(RECOMMENDATION_COLUMNS)
    .in("id", ids);
  if (productError) throw productError;
  return summarizeFeedback(
    rows,
    (products || [])
      .map(normalizeAnalysisProduct)
      .filter((product): product is Product => Boolean(product))
  );
}
