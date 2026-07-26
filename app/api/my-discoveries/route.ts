import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../server/lib/supabase.js";
import { normalizeProductRow } from "../../../server/utils/product.js";
import { verifyRegisteredBearerToken } from "../../../server/utils/verify-auth.js";

function getToken(request: Request) {
  return String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

function buildSaveCounts(rows: { product_id?: string | null; user_id?: string | null }[]) {
  const usersByProduct = new Map<string, Set<string>>();
  for (const row of rows) {
    const productId = String(row.product_id || "").trim();
    const userId = String(row.user_id || "").trim();
    if (!productId || !userId) continue;
    const users = usersByProduct.get(productId) ?? new Set<string>();
    users.add(userId);
    usersByProduct.set(productId, users);
  }
  return Object.fromEntries([...usersByProduct.entries()].map(([productId, users]) => [productId, users.size]));
}

export async function GET(request: Request) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ ok: false, error: "authentication required" }, { status: 401 });

  try {
    assertSupabaseConfig();
    const user = await verifyRegisteredBearerToken(token) as { id?: string; appUsername?: string } | null;
    const username = String(user?.appUsername || "").trim();
    const userId = String(user?.id || "").trim();
    if (!username || !userId) return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });

    const { data, error } = await supabase!
      .from("products")
      .select("*")
      .eq("registered_by", username)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const normalizedProducts = (data || [])
      .map((row) => normalizeProductRow(row))
      .filter((product) => product !== null);
    const productIds = normalizedProducts.map((product) => product.id);
    let saveCounts: Record<string, number> = {};
    if (productIds.length > 0) {
      const { data: countRows, error: countError } = await supabase!
        .from("user_digbox_items")
        .select("product_id,user_id")
        .in("product_id", productIds)
        .neq("user_id", userId);
      if (countError) throw countError;
      saveCounts = buildSaveCounts(countRows ?? []);
    }

    const products = normalizedProducts.map((product) => ({
      ...product,
      saveCount: saveCounts[product.id] || 0,
    }));
    const totalSaveCount = products.reduce((total, product) => total + product.saveCount, 0);
    return NextResponse.json({ ok: true, data: { products, totalSaveCount } });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "discoveries fetch error" },
      { status: 500 }
    );
  }
}
