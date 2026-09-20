import type { Product, StyleAxes } from "../../../src/types";
import { supabase } from "../../lib/supabase.js";
import { normalizeAnalysisProduct, RECOMMENDATION_COLUMNS } from "../catalog";
import { axisSimilarity, meanAxes } from "./engine";

export type FeedbackProfile = {
  positiveAxes: Partial<StyleAxes>;
  negativeAxes: Partial<StyleAxes>;
  total: number;
  reasons: Record<string, number>;
};
export const emptyFeedbackProfile = (): FeedbackProfile => ({
  positiveAxes: {},
  negativeAxes: {},
  total: 0,
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
    if (product)
      (row.sentiment === "positive" ? positive : negative).push(product);
    if (row.reason) reasons[row.reason] = (reasons[row.reason] || 0) + 1;
  }
  return {
    positiveAxes: meanAxes(positive),
    negativeAxes: meanAxes(negative),
    total: rows.length,
    reasons,
  };
}
export function feedbackAdjustment(
  product: Product,
  profile: FeedbackProfile
): number {
  const positive = axisSimilarity(product, profile.positiveAxes),
    negative = axisSimilarity(product, profile.negativeAxes);
  return Math.max(
    -0.12,
    Math.min(0.12, 0.12 * ((positive ?? 0) - (negative ?? 0)))
  );
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
