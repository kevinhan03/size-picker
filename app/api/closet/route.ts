import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../server/lib/supabase.js";
import { normalizeProductRow } from "../../../server/utils/product.js";
import { refreshBrandRulesCache } from "../../../server/utils/brand-rules.js";

const unauthorized = (msg = "authorization token is required") =>
  NextResponse.json({ ok: false, error: msg }, { status: 401 });

type ClosetRow = {
  product_id: string;
  added_at?: string | null;
  selected_size_label?: string | null;
  selected_size_row_index?: number | null;
  selected_size_snapshot?: unknown;
};

function getToken(request: Request) {
  return String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

function normalizeSizeSnapshot(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const headers = Array.isArray(record.headers) ? record.headers.map((v) => String(v ?? "").trim()) : [];
  const row = Array.isArray(record.row) ? record.row.map((v) => String(v ?? "").trim()) : [];
  if (!headers.length || !row.length) return null;
  return { headers, row };
}

export async function GET(request: Request) {
  const token = getToken(request);
  if (!token) return unauthorized();

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) return unauthorized(authError?.message || "invalid token");

    const closetResult = await db
      .from("user_closet_items")
      .select("product_id, added_at, selected_size_label, selected_size_row_index, selected_size_snapshot")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false });
    let closetData = closetResult.data as ClosetRow[] | null;
    let closetError = closetResult.error;

    if (closetError) {
      const fallback = await db
        .from("user_closet_items")
        .select("product_id, added_at")
        .eq("user_id", user.id)
        .order("added_at", { ascending: false });
      closetData = fallback.data as ClosetRow[] | null;
      closetError = fallback.error;
    }

    if (closetError) throw closetError;

    const productIds = (closetData ?? []).map((row: { product_id: string }) => row.product_id);
    if (productIds.length === 0) {
      return NextResponse.json({ ok: true, data: { products: [] } });
    }

    const { data: productsData, error: productsError } = await db
      .from("products")
      .select("id,brand,name,category,url,size_table,created_at,image_path,slug,is_instagram,instagram_order")
      .in("id", productIds);

    if (productsError) throw productsError;

    await refreshBrandRulesCache();

    const closetMap = new Map(
      (closetData ?? []).map((row: ClosetRow) => [String(row.product_id), row])
    );
    const productMap = new Map((productsData ?? []).map((p: { id: string }) => [String(p.id), p]));
    const products = productIds
      .map((id: string) => {
        const product = normalizeProductRow(productMap.get(id));
        if (!product) return null;
        const closetRow = closetMap.get(String(id));
        return {
          ...product,
          closetSelectedSizeLabel: String(closetRow?.selected_size_label || "").trim() || null,
          closetSelectedSizeRowIndex:
            typeof closetRow?.selected_size_row_index === "number" &&
            Number.isInteger(closetRow.selected_size_row_index)
              ? closetRow.selected_size_row_index
              : null,
          closetSelectedSizeSnapshot: normalizeSizeSnapshot(closetRow?.selected_size_snapshot),
        };
      })
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
    const selectedSizeLabel = String(body?.selectedSizeLabel || "").trim() || null;
    const selectedSizeRowIndex =
      Number.isInteger(body?.selectedSizeRowIndex) && body.selectedSizeRowIndex >= 0
        ? body.selectedSizeRowIndex
        : null;
    const selectedSizeSnapshot = normalizeSizeSnapshot(body?.selectedSizeSnapshot);

    const { error } = await db
      .from("user_closet_items")
      .insert({
        user_id: user.id,
        product_id: productId,
        selected_size_label: selectedSizeLabel,
        selected_size_row_index: selectedSizeRowIndex,
        selected_size_snapshot: selectedSizeSnapshot,
      });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, data: { alreadyAdded: true } });
      }
      if (String(error.message || "").includes("selected_size_")) {
        const fallback = await db
          .from("user_closet_items")
          .insert({ user_id: user.id, product_id: productId });
        if (!fallback.error) {
          return NextResponse.json({ ok: true, data: { added: true, sizeMetadataSkipped: true } }, { status: 201 });
        }
        if (fallback.error.code === "23505") {
          return NextResponse.json({ ok: true, data: { alreadyAdded: true } });
        }
      }
      throw error;
    }

    return NextResponse.json({ ok: true, data: { added: true } }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "closet add error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
