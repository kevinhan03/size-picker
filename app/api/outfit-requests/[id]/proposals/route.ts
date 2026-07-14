import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../../../server/lib/supabase.js";
import { verifyRegisteredBearerToken } from "../../../../../server/utils/verify-auth.js";
import { getBearerToken, hydrateRequestDetail, validateProposalInput } from "../../../../../server/utils/outfits.js";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const token = getBearerToken(request);
  if (!token) return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const user = await verifyRegisteredBearerToken(token);
    if (!user) return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });
    const { id } = await context.params;
    const parsed = validateProposalInput(await request.json());
    if (parsed.error || !parsed.value) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }
    const proposalInput = parsed.value as { productIds: string[]; explanation: string };
    const { data: outfitRequest, error: requestError } = await db
      .from("outfit_requests")
      .select("id,author_id,description,status,accepted_proposal_id,created_at")
      .eq("id", id)
      .maybeSingle();
    if (requestError) throw requestError;
    if (!outfitRequest) return NextResponse.json({ ok: false, error: "코디 요청을 찾을 수 없습니다." }, { status: 404 });
    if (outfitRequest.status !== "open") {
      return NextResponse.json({ ok: false, error: "이미 완료된 요청입니다." }, { status: 409 });
    }
    if (String(outfitRequest.author_id) === String(user.id)) {
      return NextResponse.json({ ok: false, error: "자신의 요청에는 코디를 제안할 수 없습니다." }, { status: 403 });
    }

    const { data: sharedItems, error: sharedError } = await db
      .from("outfit_request_items")
      .select("product_id")
      .eq("request_id", id);
    if (sharedError) throw sharedError;
    const sharedIds = new Set((sharedItems || []).map((item) => String(item.product_id)));
    if (proposalInput.productIds.some((productId) => !sharedIds.has(productId))) {
      return NextResponse.json({ ok: false, error: "요청에 공유되지 않은 상품이 포함되어 있습니다." }, { status: 400 });
    }

    const { data: proposal, error: proposalError } = await db
      .from("outfit_proposals")
      .insert({ request_id: id, author_id: user.id, explanation: proposalInput.explanation })
      .select("id")
      .single();
    if (proposalError?.code === "23505") {
      return NextResponse.json({ ok: false, error: "이 요청에는 이미 코디를 제안했습니다." }, { status: 409 });
    }
    if (proposalError) throw proposalError;

    const { error: itemError } = await db.from("outfit_proposal_items").insert(
      proposalInput.productIds.map((productId, sortOrder) => ({
        proposal_id: proposal.id,
        product_id: Number(productId),
        sort_order: sortOrder,
      }))
    );
    if (itemError) {
      await db.from("outfit_proposals").delete().eq("id", proposal.id).eq("author_id", user.id);
      throw itemError;
    }

    const hydrated = await hydrateRequestDetail(db, outfitRequest);
    return NextResponse.json({ ok: true, data: { request: hydrated } }, { status: 201 });
  } catch (error: unknown) {
    console.error("[outfits] proposal create failed", error);
    return NextResponse.json({ ok: false, error: "코디 제안을 저장하지 못했습니다." }, { status: 500 });
  }
}
