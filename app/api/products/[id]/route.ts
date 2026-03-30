import { NextResponse } from "next/server";
import { createProductStack } from "../../../../server/bootstrap/products.js";

const {
  SUPABASE_PRODUCTS_TABLE,
  assertSupabaseConfig,
  normalizeProductRow,
  refreshBrandRulesCache,
  supabase,
} = createProductStack();

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
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
      .select("*")
      .eq("id", productId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ ok: false, error: "product not found" }, { status: 404 });
    }

    const product = normalizeProductRow(data);
    if (!product) {
      return NextResponse.json({ ok: false, error: "product not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: { product } });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "product fetch error" },
      { status: 500 }
    );
  }
}
