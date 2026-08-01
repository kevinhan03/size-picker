import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { assertSupabaseConfig, supabase } from "../../../../../server/lib/supabase.js";
import { SUPABASE_PRODUCTS_TABLE } from "../../../../../server/config/env.js";
import { ANALYSIS_COLUMNS, normalizeAnalysisProduct, normalizeClientProduct, requestLog } from "../../../../../server/services/catalog";
import { buildProductRecommendations } from "../../../../../server/services/product-recommendations";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const startedAt = Date.now();
  const { id } = await context.params;
  const productId = String(id || "").match(/^\d+/)?.[0] || "";
  if (!productId) return NextResponse.json({ ok: false, error: "product id required" }, { status: 400 });

  try {
    assertSupabaseConfig();
    const { data, error } = await supabase!
      .from(SUPABASE_PRODUCTS_TABLE)
      .select(ANALYSIS_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rawRows = (data || []) as unknown[];
    const rawRowsById = new Map(rawRows.map((row) => [String((row as { id?: unknown }).id), row]));
    const analysisProducts = rawRows.map(normalizeAnalysisProduct).filter((product): product is NonNullable<typeof product> => Boolean(product));
    const source = analysisProducts.find((product) => product.id === productId);
    if (!source) {
      requestLog("/api/products/[id]/recommendations", request, startedAt, 404);
      return NextResponse.json({ ok: false, error: "product not found" }, { status: 404 });
    }
    const recommendations = buildProductRecommendations(source, analysisProducts);
    const toClient = (product: typeof source) => normalizeClientProduct(rawRowsById.get(product.id));
    const sourceProduct = toClient(source);
    const similarProducts = recommendations.similarProducts.map(toClient).filter(Boolean);
    const styleProducts = recommendations.styleProducts.map(toClient).filter(Boolean);
    requestLog("/api/products/[id]/recommendations", request, startedAt, 200);
    return NextResponse.json(
      { ok: true, data: { sourceProduct, similarProducts, styleProducts } },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800" } },
    );
  } catch (error: unknown) {
    const status = getErrorStatusCode(error);
    requestLog("/api/products/[id]/recommendations", request, startedAt, status);
    return NextResponse.json({ ok: false, error: getErrorMessage(error, "product recommendations error") }, { status });
  }
}
