import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../server/lib/supabase.js";
import { ANALYSIS_COLUMNS, PRODUCT_CARD_COLUMNS, normalizeAnalysisProduct, normalizeProductCard, requestLog } from "../../../server/services/catalog";
import { getRegisteredRequestUser, hasValidMutationOrigin } from "../../../server/auth/request-user";
import { getDigboxProducts } from "../../../server/services/user-collections";

const unauthorized = (msg = "authorization token is required") =>
  NextResponse.json({ ok: false, error: msg }, { status: 401 });

function normalizeSizeSnapshot(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const headers = Array.isArray(record.headers) ? record.headers.map((item) => String(item ?? "").trim()) : [];
  const row = Array.isArray(record.row) ? record.row.map((item) => String(item ?? "").trim()) : [];
  return headers.length && row.length ? { headers, row } : null;
}

function normalizeSizeDecision(row: Record<string, unknown>) {
  const label = String(row.size_decision_label ?? "").trim() || null;
  if (!label) return null;
  const sources = Array.isArray(row.size_decision_sources)
    ? row.size_decision_sources.map((source) => String(source)).filter((source) => ["comparison", "try_on", "worn"].includes(source))
    : [];
  const fit = String(row.size_decision_fit ?? "");
  return {
    label,
    rowIndex: Number.isInteger(row.size_decision_row_index) ? Number(row.size_decision_row_index) : null,
    snapshot: normalizeSizeSnapshot(row.size_decision_snapshot),
    sources,
    fit: ["tight", "true_to_size", "roomy"].includes(fit) ? fit : null,
    note: String(row.size_decision_note ?? "").trim() || null,
    updatedAt: String(row.size_decision_updated_at ?? "").trim() || null,
  };
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  const includeAnalysis = new URL(request.url).searchParams.get("analysis") === "1";

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const user = await getRegisteredRequestUser(request);
    if (!user) return unauthorized("registered account required");

    if (!includeAnalysis) {
      const data = await getDigboxProducts(user.id);
      requestLog("/api/digbox", request, startedAt, 200);
      return NextResponse.json(
        { ok: true, data },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const { data: digboxData, error: digboxError } = await db
      .from("user_digbox_items")
      .select("product_id, added_at, size_decision_label, size_decision_row_index, size_decision_snapshot, size_decision_sources, size_decision_fit, size_decision_note, size_decision_updated_at")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false });

    if (digboxError) throw digboxError;

    const productIds = (digboxData ?? []).map((row: { product_id: string }) => row.product_id);
    if (productIds.length === 0) {
      return NextResponse.json({ ok: true, data: { products: [], discoveredDigboxCounts: {} } });
    }

    const { data: productsData, error: productsError } = await db
      .from("products")
      .select(includeAnalysis ? ANALYSIS_COLUMNS : `${PRODUCT_CARD_COLUMNS},registered_by`)
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
      const { data: countRows, error: countError } = await db.rpc("get_digbox_counts", {
        product_ids: discoveredProductIds,
      });

      if (countError) throw countError;
      discoveredDigboxCounts = {};
      for (const row of (countRows ?? []) as Array<{ product_id?: string; save_count?: number | string }>) {
        const countedProductId = String(row.product_id || "");
        const count = Math.max(0, Number(row.save_count) - 1);
        if (countedProductId && count > 0) discoveredDigboxCounts[countedProductId] = count;
      }
    }

    const productMap = new Map(rawProducts.map((p) => [String(p.id), p]));
    const digboxByProductId = new Map(
      (digboxData ?? []).map((row: Record<string, unknown> & { product_id: string; added_at?: string | null }) => [
        String(row.product_id),
        row,
      ])
    );
    const products = productIds
      .map((id: string) => {
        const product = includeAnalysis
          ? normalizeAnalysisProduct(productMap.get(id))
          : normalizeProductCard(productMap.get(id));
        const digboxRow = digboxByProductId.get(String(id));
        return product && includeAnalysis
          ? { ...product, collectionAddedAt: digboxRow?.added_at ? String(digboxRow.added_at) : null, digboxSizeDecision: digboxRow ? normalizeSizeDecision(digboxRow) : null }
          : product;
      })
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
  if (!hasValidMutationOrigin(request)) {
    return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
  }

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const user = await getRegisteredRequestUser(request);
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
