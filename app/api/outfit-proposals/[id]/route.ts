import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { verifyRegisteredBearerToken } from "../../../../server/utils/verify-auth.js";
import { getBearerToken, hydrateRequestDetail, validateProposalInput } from "../../../../server/utils/outfits.js";

const notFound = () => NextResponse.json({ ok: false, error: "코디 제안을 찾을 수 없습니다." }, { status: 404 });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
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

    const { data: proposal, error: proposalError } = await db
      .from("outfit_proposals")
      .select("id,request_id,author_id,explanation")
      .eq("id", id)
      .eq("author_id", user.id)
      .maybeSingle();
    if (proposalError) throw proposalError;
    if (!proposal) return notFound();

    const { data: outfitRequest, error: requestError } = await db
      .from("outfit_requests")
      .select("id,author_id,description,status,accepted_proposal_id,created_at")
      .eq("id", proposal.request_id)
      .maybeSingle();
    if (requestError) throw requestError;
    if (!outfitRequest) return notFound();
    if (outfitRequest.status !== "open" || String(outfitRequest.accepted_proposal_id || "") === id) {
      return NextResponse.json({ ok: false, error: "완료되거나 채택된 코디 제안은 수정할 수 없습니다." }, { status: 409 });
    }

    const { data: sharedItems, error: sharedError } = await db
      .from("outfit_request_items")
      .select("product_id")
      .eq("request_id", proposal.request_id);
    if (sharedError) throw sharedError;
    const sharedIds = new Set((sharedItems || []).map((item) => String(item.product_id)));
    if (proposalInput.productIds.some((productId) => !sharedIds.has(productId))) {
      return NextResponse.json({ ok: false, error: "요청에 공유되지 않은 상품이 포함되어 있습니다." }, { status: 400 });
    }

    const { data: previousItems, error: previousItemsError } = await db
      .from("outfit_proposal_items")
      .select("product_id,sort_order")
      .eq("proposal_id", id)
      .order("sort_order", { ascending: true });
    if (previousItemsError) throw previousItemsError;

    const restorePreviousItems = async () => {
      const { error: cleanupError } = await db.from("outfit_proposal_items").delete().eq("proposal_id", id);
      if (cleanupError) throw cleanupError;
      if (previousItems?.length) {
        const { error: restoreError } = await db.from("outfit_proposal_items").insert(
          previousItems.map((item) => ({
            proposal_id: id,
            product_id: Number(item.product_id),
            sort_order: Number(item.sort_order),
          }))
        );
        if (restoreError) throw restoreError;
      }
    };

    const { error: deleteItemsError } = await db.from("outfit_proposal_items").delete().eq("proposal_id", id);
    if (deleteItemsError) throw deleteItemsError;

    const { error: insertItemsError } = await db.from("outfit_proposal_items").insert(
      proposalInput.productIds.map((productId, sortOrder) => ({
        proposal_id: id,
        product_id: Number(productId),
        sort_order: sortOrder,
      }))
    );
    if (insertItemsError) {
      try { await restorePreviousItems(); }
      catch (rollbackError) { console.error("[outfits] proposal item rollback failed", rollbackError); }
      throw insertItemsError;
    }

    const { error: updateError } = await db
      .from("outfit_proposals")
      .update({ explanation: proposalInput.explanation })
      .eq("id", id)
      .eq("author_id", user.id);
    if (updateError) {
      try { await restorePreviousItems(); }
      catch (rollbackError) { console.error("[outfits] proposal item rollback failed", rollbackError); }
      throw updateError;
    }

    const hydrated = await hydrateRequestDetail(db, outfitRequest);
    return NextResponse.json({ ok: true, data: { request: hydrated } });
  } catch (error: unknown) {
    console.error("[outfits] proposal update failed", error);
    return NextResponse.json({ ok: false, error: "코디 제안을 수정하지 못했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const token = getBearerToken(request);
  if (!token) return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const user = await verifyRegisteredBearerToken(token);
    if (!user) return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });
    const { id } = await context.params;
    const { data: proposal, error: proposalError } = await db
      .from("outfit_proposals")
      .select("id,request_id,author_id")
      .eq("id", id)
      .eq("author_id", user.id)
      .maybeSingle();
    if (proposalError) throw proposalError;
    if (!proposal) return notFound();
    const { data: outfitRequest, error: requestError } = await db
      .from("outfit_requests")
      .select("status,accepted_proposal_id")
      .eq("id", proposal.request_id)
      .maybeSingle();
    if (requestError) throw requestError;
    if (!outfitRequest) return notFound();
    if (outfitRequest.status !== "open" || String(outfitRequest.accepted_proposal_id || "") === id) {
      return NextResponse.json({ ok: false, error: "완료되거나 채택된 제안은 삭제할 수 없습니다." }, { status: 409 });
    }
    const { error } = await db.from("outfit_proposals").delete().eq("id", id).eq("author_id", user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (error: unknown) {
    console.error("[outfits] proposal delete failed", error);
    return NextResponse.json({ ok: false, error: "코디 제안을 삭제하지 못했습니다." }, { status: 500 });
  }
}
