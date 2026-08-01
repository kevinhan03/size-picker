import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { SUPABASE_PRODUCTS_TABLE } from "../../../../server/config/env.js";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { refreshBrandRulesCache } from "../../../../server/utils/brand-rules.js";
import { CATALOG_COLUMNS, normalizeClientProduct, requestLog } from "../../../../server/services/catalog";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const startedAt = Date.now();
  const { id } = await context.params;
  const productId = String(id || "").trim();
  if (!productId) {
    return NextResponse.json({ ok: false, error: "product id required" }, { status: 400 });
  }

  try {
    assertSupabaseConfig();
    await refreshBrandRulesCache();
    const { data, error } = await supabase!
      .from(SUPABASE_PRODUCTS_TABLE)
      .select(CATALOG_COLUMNS)
      .eq("id", productId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ ok: false, error: "product not found" }, { status: 404 });
    }

    const product = normalizeClientProduct(data);
    if (!product) {
      return NextResponse.json({ ok: false, error: "product not found" }, { status: 404 });
    }

    requestLog("/api/products/[id]", request, startedAt, 200);
    return NextResponse.json(
      { ok: true, data: { product } },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error: unknown) {
    const status = getErrorStatusCode(error);
    requestLog("/api/products/[id]", request, startedAt, status);
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "product fetch error") },
      { status }
    );
  }
}
