import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { SUPABASE_PRODUCTS_TABLE } from "../../../../server/config/env.js";
import { RECOMMENDATION_COLUMNS, normalizeAnalysisProduct, requestLog } from "../../../../server/services/catalog";

const MAX_IDS = 3;

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const ids = Array.from(new Set(String(request.nextUrl.searchParams.get("ids") || "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^\d+$/.test(id))))
    .slice(0, MAX_IDS);

  if (!ids.length) {
    requestLog("/api/catalog/by-ids", request, startedAt, 200);
    return NextResponse.json({ ok: true, data: { products: [] } });
  }

  try {
    assertSupabaseConfig();
    const { data, error } = await supabase!
      .from(SUPABASE_PRODUCTS_TABLE)
      .select(RECOMMENDATION_COLUMNS)
      .in("id", ids);
    if (error) throw error;
    const byId = new Map(((data || []) as unknown[]).map((row: unknown) => {
      const product = normalizeAnalysisProduct(row);
      return [product?.id, product] as const;
    }));
    const products = ids.map((id) => byId.get(id)).filter(Boolean);
    requestLog("/api/catalog/by-ids", request, startedAt, 200);
    return NextResponse.json(
      { ok: true, data: { products } },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error: unknown) {
    const status = getErrorStatusCode(error);
    requestLog("/api/catalog/by-ids", request, startedAt, status);
    return NextResponse.json({ ok: false, error: getErrorMessage(error, "catalog product batch error") }, { status });
  }
}
