import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../server/lib/supabase.js";
import { getRegisteredRequestUser, hasValidMutationOrigin } from "../../../server/auth/request-user";
import { listOutfitRequests } from "../../../server/services/outfit-requests";
import { requestLog } from "../../../server/services/catalog";
import {
  hydrateRequestDetail,
  OUTFIT_PRODUCT_SNAPSHOT_SELECT,
  validateRequestInput,
} from "../../../server/utils/outfits.js";

const REQUEST_SELECT = "id,author_id,description,status,accepted_proposal_id,created_at";

function unauthorized(message = "registered account required") {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  try {
    const user = await getRegisteredRequestUser(request);
    if (!user) {
      requestLog("/api/outfit-requests", request, startedAt, 401);
      return unauthorized();
    }

    const url = new URL(request.url);
    const scope = ["open", "completed", "mine", "proposed"].includes(url.searchParams.get("scope") || "")
      ? String(url.searchParams.get("scope"))
      : "open";
    const status = ["open", "accepted", "closed"].includes(url.searchParams.get("status") || "")
      ? String(url.searchParams.get("status"))
      : "all";
    const cursor = url.searchParams.get("cursor");
    const limit = Math.min(20, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "20", 10) || 20));

    const data = await listOutfitRequests(user.id, scope as "open" | "completed" | "mine" | "proposed", cursor, status as "all" | "open" | "accepted" | "closed", limit);
    requestLog("/api/outfit-requests", request, startedAt, 200);
    return NextResponse.json({ ok: true, data });
  } catch (error: unknown) {
    console.error("[outfits] list failed", error);
    requestLog("/api/outfit-requests", request, startedAt, 500);
    return NextResponse.json({ ok: false, error: "코디 요청을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const user = await getRegisteredRequestUser(request);
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
