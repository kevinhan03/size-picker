import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../server/lib/supabase.js";
import { normalizeProductRow } from "../../../server/utils/product.js";
import { refreshBrandRulesCache } from "../../../server/utils/brand-rules.js";

const unauthorized = (msg = "authorization token is required") =>
  NextResponse.json({ ok: false, error: msg }, { status: 401 });

function getToken(request: Request) {
  return String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

export async function GET(request: Request) {
  const token = getToken(request);
  if (!token) return unauthorized();

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) return unauthorized(authError?.message || "invalid token");

    const { data: closetData, error: closetError } = await db
      .from("user_closet_items")
      .select("product_id, added_at")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false });

    if (closetError) throw closetError;

    const productIds = (closetData ?? []).map((row: { product_id: string }) => row.product_id);
    if (productIds.length === 0) {
      return NextResponse.json({ ok: true, data: { products: [] } });
    }

    const { data: productsData, error: productsError } = await db
      .from("products")
      .select("id,brand,name,category,url,size_table,created_at,image_path,slug,is_instagram")
      .in("id", productIds);

    if (productsError) throw productsError;

    await refreshBrandRulesCache();

    const productMap = new Map((productsData ?? []).map((p: { id: string }) => [String(p.id), p]));
    const products = productIds
      .map((id: string) => normalizeProductRow(productMap.get(id)))
      .filter(Boolean);

    return NextResponse.json({ ok: true, data: { products } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "closet fetch error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = getToken(request);
  if (!token) return unauthorized();

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) return unauthorized(authError?.message || "invalid token");

    const body = await request.json();
    const productId = String(body?.productId || "").trim();
    if (!productId) return NextResponse.json({ ok: false, error: "productId is required" }, { status: 400 });

    const { error } = await db
      .from("user_closet_items")
      .insert({ user_id: user.id, product_id: productId });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, data: { alreadyAdded: true } });
      }
      throw error;
    }

    return NextResponse.json({ ok: true, data: { added: true } }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "closet add error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
