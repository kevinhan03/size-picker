import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { SUPABASE_PRODUCTS_TABLE } from "../../../../server/config/env.js";
import { CATALOG_COLUMNS, normalizeClientProduct, requestLog } from "../../../../server/services/catalog";

const MAX_LIMIT = 12;

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const query = String(request.nextUrl.searchParams.get("q") || "").trim().slice(0, 80);
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") || "8");
  const limit = Math.max(1, Math.min(MAX_LIMIT, Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 8));

  if (query.length < 2) {
    requestLog("/api/catalog/search", request, startedAt, 200);
    return NextResponse.json({ ok: true, data: { products: [] } });
  }

  try {
    assertSupabaseConfig();
    const buildQuery = (column: "brand" | "name") => supabase!
      .from(SUPABASE_PRODUCTS_TABLE)
      .select(CATALOG_COLUMNS)
      .ilike(column, `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(limit);
    const [brandResult, nameResult] = await Promise.all([buildQuery("brand"), buildQuery("name")]);
    if (brandResult.error) throw brandResult.error;
    if (nameResult.error) throw nameResult.error;

    const unique = new Map<string, ReturnType<typeof normalizeClientProduct>>();
    for (const row of [...(brandResult.data || []), ...(nameResult.data || [])]) {
      const product = normalizeClientProduct(row);
      if (product && !unique.has(product.id)) unique.set(product.id, product);
    }
    const products = Array.from(unique.values()).filter(Boolean).slice(0, limit);
    requestLog("/api/catalog/search", request, startedAt, 200);
    return NextResponse.json(
      { ok: true, data: { products } },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error: unknown) {
    const status = getErrorStatusCode(error);
    requestLog("/api/catalog/search", request, startedAt, status);
    return NextResponse.json({ ok: false, error: getErrorMessage(error, "catalog search error") }, { status });
  }
}
