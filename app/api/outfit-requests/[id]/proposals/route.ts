import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../../../server/lib/supabase.js";
import { getRegisteredRequestUser, hasValidMutationOrigin } from "../../../../../server/auth/request-user";
import { revalidateOpenOutfits } from "../../../../../server/services/outfit-cache";
import { hydrateRequestDetail, outfitMessage, validateProposalInput } from "../../../../../server/utils/outfits.js";
import { getRequestLocale } from "../../../../../server/utils/locale";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasValidMutationOrigin(request)) return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });

  const locale = await getRequestLocale();
  try {
    assertSupabaseConfig();
    const db = supabase!;
    const user = await getRegisteredRequestUser(request);
    if (!user) return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });
    const { id } = await context.params;
    const parsed = validateProposalInput(await request.json(), locale);
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
    if (!outfitRequest) return NextResponse.json({ ok: false, error: outfitMessage(locale, "requestNotFound") }, { status: 404 });
    if (outfitRequest.status !== "open") {
      return NextResponse.json({ ok: false, error: outfitMessage(locale, "requestAlreadyClosed") }, { status: 409 });
    }
    if (String(outfitRequest.author_id) === String(user.id)) {
      return NextResponse.json({ ok: false, error: outfitMessage(locale, "cannotProposeOwnRequest") }, { status: 403 });
    }

    const { data: sharedItems, error: sharedError } = await db
      .from("outfit_request_items")
      .select("product_id")
      .eq("request_id", id);
    if (sharedError) throw sharedError;
    const sharedIds = new Set((sharedItems || []).map((item) => String(item.product_id)));
    if (proposalInput.productIds.some((productId) => !sharedIds.has(productId))) {
      return NextResponse.json({ ok: false, error: outfitMessage(locale, "productsNotSharedWithRequest") }, { status: 400 });
    }

    const { data: proposal, error: proposalError } = await db
      .from("outfit_proposals")
      .insert({ request_id: id, author_id: user.id, explanation: proposalInput.explanation })
      .select("id")
      .single();
    if (proposalError?.code === "23505") {
      return NextResponse.json({ ok: false, error: outfitMessage(locale, "proposalAlreadyExists") }, { status: 409 });
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
    revalidateOpenOutfits();

    const hydrated = await hydrateRequestDetail(db, outfitRequest, locale);
    return NextResponse.json({ ok: true, data: { request: hydrated } }, { status: 201 });
  } catch (error: unknown) {
    console.error("[outfits] proposal create failed", error);
    return NextResponse.json({ ok: false, error: outfitMessage(locale, "proposalSaveFailed") }, { status: 500 });
  }
}
