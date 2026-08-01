import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { assertSupabaseConfig, supabase } from "../../../../../server/lib/supabase.js";
import { SUPABASE_PRODUCTS_TABLE } from "../../../../../server/config/env.js";
import { RECOMMENDATION_COLUMNS, normalizeAnalysisProduct, normalizeProductCard, requestLog } from "../../../../../server/services/catalog";
import { buildProductRecommendations } from "../../../../../server/services/product-recommendations";

type CandidateRow = { id?: string | number; visual_similarity?: number | string };

async function queryRecommendationData(productId: string) {
  assertSupabaseConfig();
  const { data: candidateRows, error: candidateError } = await supabase!.rpc(
    "get_product_recommendation_candidates",
    { source_product_id: Number(productId), candidate_limit: 60 },
  );
  if (candidateError) throw candidateError;

  const visualScores = new Map<string, number>();
  for (const row of (candidateRows || []) as CandidateRow[]) {
    const candidateId = String(row.id || "");
    const score = Number(row.visual_similarity);
    if (candidateId && Number.isFinite(score)) visualScores.set(candidateId, score);
  }
  const ids = [productId, ...visualScores.keys()];
  const { data, error } = await supabase!
    .from(SUPABASE_PRODUCTS_TABLE)
    .select(RECOMMENDATION_COLUMNS)
    .in("id", ids);
  if (error) throw error;

  const rawRows = (data || []) as unknown[];
  const rawRowsById = new Map(rawRows.map((row) => [String((row as { id?: unknown }).id), row]));
  const source = normalizeAnalysisProduct(rawRowsById.get(productId));
  if (!source) return null;

  const candidates = [...visualScores.keys()]
    .map((candidateId) => normalizeAnalysisProduct(rawRowsById.get(candidateId)))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));
  const recommendations = buildProductRecommendations(source, candidates, visualScores);
  const toCard = (product: typeof source) => normalizeProductCard(rawRowsById.get(product.id));

  return {
    sourceProduct: toCard(source),
    similarProducts: recommendations.similarProducts.map(toCard).filter(Boolean),
    styleProducts: recommendations.styleProducts.map(toCard).filter(Boolean),
  };
}

const getRecommendationData = (productId: string) => unstable_cache(
  () => queryRecommendationData(productId),
  ["product-recommendations-v2", productId],
  { revalidate: 300, tags: ["recommendations", `recommendations:${productId}`] },
)();

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const startedAt = Date.now();
  const { id } = await context.params;
  const productId = String(id || "").match(/^\d+/)?.[0] || "";
  if (!productId) return NextResponse.json({ ok: false, error: "product id required" }, { status: 400 });

  try {
    const data = await getRecommendationData(productId);
    if (!data) {
      requestLog("/api/products/[id]/recommendations", request, startedAt, 404);
      return NextResponse.json({ ok: false, error: "product not found" }, { status: 404 });
    }

    requestLog("/api/products/[id]/recommendations", request, startedAt, 200);
    return NextResponse.json(
      { ok: true, data },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800" } },
    );
  } catch (error: unknown) {
    const status = getErrorStatusCode(error);
    requestLog("/api/products/[id]/recommendations", request, startedAt, status);
    return NextResponse.json({ ok: false, error: getErrorMessage(error, "product recommendations error") }, { status });
  }
}
