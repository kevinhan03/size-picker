import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../server/lib/supabase.js";
import { ANALYSIS_COLUMNS, CATALOG_COLUMNS, normalizeAnalysisProduct, normalizeClientProduct, requestLog } from "../../../server/services/catalog";
import { refreshBrandRulesCache } from "../../../server/utils/brand-rules.js";
import { verifyRegisteredBearerToken } from "../../../server/utils/verify-auth.js";

const unauthorized = (msg = "authorization token is required") =>
  NextResponse.json({ ok: false, error: msg }, { status: 401 });

function getToken(request: Request) {
  return String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

function buildOtherDigboxCounts(rows: { product_id?: string | null; user_id?: string | null }[]) {
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
  const startedAt = Date.now();
  const includeAnalysis = new URL(request.url).searchParams.get("analysis") === "1";
  const token = getToken(request);
  if (!token) return unauthorized();

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const user = await verifyRegisteredBearerToken(token);
    if (!user) return unauthorized("registered account required");

    const { data: digboxData, error: digboxError } = await db
      .from("user_digbox_items")
      .select("product_id, added_at")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false });

    if (digboxError) throw digboxError;

    const productIds = (digboxData ?? []).map((row: { product_id: string }) => row.product_id);
    if (productIds.length === 0) {
      return NextResponse.json({ ok: true, data: { products: [], discoveredDigboxCounts: {} } });
    }

    const { data: productsData, error: productsError } = await db
      .from("products")
      .select(includeAnalysis ? ANALYSIS_COLUMNS : CATALOG_COLUMNS)
      .in("id", productIds);

    if (productsError) throw productsError;

    const { data: userData, error: userError } = await db
      .from("users")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    if (userError) throw userError;
    const username = String(userData?.username || "").trim();
    const rawProducts = (productsData ?? []) as unknown as Array<{ id?: string; registered_by?: string | null }>;
    const discoveredProductIds = username
      ? rawProducts
          .filter((product) => String(product.registered_by || "").trim() === username)
          .map((product) => String(product.id || "").trim())
          .filter(Boolean)
      : [];

    let discoveredDigboxCounts: Record<string, number> = {};
    if (discoveredProductIds.length > 0) {
      const { data: countRows, error: countError } = await db
        .from("user_digbox_items")
        .select("product_id, user_id")
        .in("product_id", discoveredProductIds)
        .neq("user_id", user.id);

      if (countError) throw countError;
      discoveredDigboxCounts = buildOtherDigboxCounts(countRows ?? []);
    }

    await refreshBrandRulesCache();

    const productMap = new Map(rawProducts.map((p) => [String(p.id), p]));
    const products = productIds
      .map((id: string) => includeAnalysis
        ? normalizeAnalysisProduct(productMap.get(id))
        : normalizeClientProduct(productMap.get(id)))
      .filter(Boolean);

    requestLog("/api/digbox", request, startedAt, 200);
    return NextResponse.json({ ok: true, data: { products, discoveredDigboxCounts } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error: unknown) {
    requestLog("/api/digbox", request, startedAt, 500);
    const message = error instanceof Error ? error.message : "digbox fetch error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = getToken(request);
  if (!token) return unauthorized();

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const user = await verifyRegisteredBearerToken(token);
    if (!user) return unauthorized("registered account required");

    const body = await request.json();
    const productId = String(body?.productId || "").trim();
    if (!productId) return NextResponse.json({ ok: false, error: "productId is required" }, { status: 400 });

    const { error } = await db
      .from("user_digbox_items")
      .insert({ user_id: user.id, product_id: productId });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, data: { alreadyAdded: true } });
      }
      throw error;
    }

    return NextResponse.json({ ok: true, data: { added: true } }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "digbox add error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
