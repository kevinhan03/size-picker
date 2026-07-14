import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../server/lib/supabase.js";
import { verifyRegisteredBearerToken } from "../../../server/utils/verify-auth.js";
import {
  getBearerToken,
  hydrateRequestDetail,
  hydrateRequestSummaries,
  OUTFIT_PRODUCT_SNAPSHOT_SELECT,
  validateRequestInput,
} from "../../../server/utils/outfits.js";

const REQUEST_SELECT = "id,author_id,description,status,accepted_proposal_id,created_at";

function unauthorized(message = "registered account required") {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export async function GET(request: Request) {
  const token = getBearerToken(request);
  if (!token) return unauthorized();

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const user = await verifyRegisteredBearerToken(token);
    if (!user) return unauthorized();

    const url = new URL(request.url);
    const scope = ["open", "completed", "mine"].includes(url.searchParams.get("scope") || "")
      ? String(url.searchParams.get("scope"))
      : "open";
    const status = ["open", "accepted", "closed"].includes(url.searchParams.get("status") || "")
      ? String(url.searchParams.get("status"))
      : "all";
    const offset = Math.max(0, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0);
    const limit = Math.min(20, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "20", 10) || 20));

    let query = db.from("outfit_requests").select(REQUEST_SELECT, { count: "exact" });
    if (scope === "open") query = query.eq("status", "open").neq("author_id", user.id);
    if (scope === "completed") query = query.in("status", ["accepted", "closed"]);
    if (scope === "mine") {
      query = query.eq("author_id", user.id);
      if (status !== "all") query = query.eq("status", status);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    const requests = await hydrateRequestSummaries(db, data || []);

    return NextResponse.json({
      ok: true,
      data: { requests, total: count || 0, nextOffset: offset + requests.length, currentUserId: user.id },
    });
  } catch (error: unknown) {
    console.error("[outfits] list failed", error);
    return NextResponse.json({ ok: false, error: "코디 요청을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = getBearerToken(request);
  if (!token) return unauthorized();

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const user = await verifyRegisteredBearerToken(token);
    if (!user) return unauthorized();
    const parsed = validateRequestInput(await request.json());
    if (parsed.error || !parsed.value) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    const { description, focusProductIds } = parsed.value as { description: string; focusProductIds: string[] };
    const { data: closetRows, error: closetError } = await db
      .from("user_closet_items")
      .select("product_id,added_at")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false });
    if (closetError) throw closetError;
    const closetIds = (closetRows || [])
      .map((row) => String(row.product_id || "").trim())
      .filter((id) => /^\d+$/.test(id));
    const { data: existingProducts, error: productError } = closetIds.length
      ? await db.from("products").select(OUTFIT_PRODUCT_SNAPSHOT_SELECT).in("id", closetIds)
      : { data: [], error: null };
    if (productError) throw productError;
    const snapshotsById = new Map((existingProducts || []).map((row) => [String(row.id), row]));
    const productIds = closetIds.filter((id) => snapshotsById.has(id));
    if (productIds.length < 2) {
      return NextResponse.json(
        { ok: false, error: "코디 요청에는 Closet 상품이 2개 이상 필요합니다.", code: "CLOSET_TOO_SMALL" },
        { status: 409 }
      );
    }
    const closetIdSet = new Set(productIds);
    if (focusProductIds.some((id) => !closetIdSet.has(id))) {
      return NextResponse.json(
        { ok: false, error: "우선 활용할 상품은 현재 Closet에서만 선택할 수 있습니다." },
        { status: 400 }
      );
    }
    const focusIdSet = new Set(focusProductIds);

    const { data: created, error: createError } = await db
      .from("outfit_requests")
      .insert({ author_id: user.id, description })
      .select(REQUEST_SELECT)
      .single();
    if (createError) throw createError;

    const { error: itemError } = await db.from("outfit_request_items").insert(
      productIds.map((productId, sortOrder) => ({
        request_id: created.id,
        product_id: Number(productId),
        sort_order: sortOrder,
        is_focus: focusIdSet.has(productId),
        product_snapshot: snapshotsById.get(productId),
      }))
    );
    if (itemError) {
      await db.from("outfit_requests").delete().eq("id", created.id).eq("author_id", user.id);
      throw itemError;
    }

    const outfitRequest = await hydrateRequestDetail(db, created);
    return NextResponse.json({ ok: true, data: { request: outfitRequest } }, { status: 201 });
  } catch (error: unknown) {
    console.error("[outfits] create failed", error);
    return NextResponse.json({ ok: false, error: "코디 요청을 저장하지 못했습니다." }, { status: 500 });
  }
}
