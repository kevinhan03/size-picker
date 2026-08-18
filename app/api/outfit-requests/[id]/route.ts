import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { getRegisteredRequestUser, hasValidMutationOrigin } from "../../../../server/auth/request-user";
import { revalidateOpenOutfits } from "../../../../server/services/outfit-cache";
import { hydrateRequestDetail, outfitMessage } from "../../../../server/utils/outfits.js";
import { getRequestLocale } from "../../../../server/utils/locale";

const REQUEST_SELECT = "id,author_id,description,status,accepted_proposal_id,created_at";
const notFound = (locale: string) => NextResponse.json({ ok: false, error: outfitMessage(locale, "requestNotFound") }, { status: 404 });

async function registeredUser(request: Request) {
  return getRegisteredRequestUser(request);
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const locale = await getRequestLocale();
  try {
    assertSupabaseConfig();
    const user = await registeredUser(request);
    const { id } = await context.params;
    const { data, error } = await supabase!.from("outfit_requests").select(REQUEST_SELECT).eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return notFound(locale);
    const outfitRequest = await hydrateRequestDetail(supabase!, data, locale);
    return NextResponse.json({ ok: true, data: { request: outfitRequest, currentUserId: user?.id || null } });
  } catch (error: unknown) {
    console.error("[outfits] detail failed", error);
    return NextResponse.json({ ok: false, error: outfitMessage(locale, "requestLoadFailed") }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasValidMutationOrigin(request)) return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
  const locale = await getRequestLocale();
  try {
    assertSupabaseConfig();
    const db = supabase!;
    const user = await registeredUser(request);
    if (!user) return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });
    const { id } = await context.params;
    const body = await request.json();
    const action = String(body?.action || "");
    const { data: existing, error: existingError } = await db
      .from("outfit_requests")
      .select(REQUEST_SELECT)
      .eq("id", id)
      .eq("author_id", user.id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) return notFound(locale);
    if (existing.status !== "open") {
      return NextResponse.json({ ok: false, error: outfitMessage(locale, "requestAlreadyClosed") }, { status: 409 });
    }

    let updates: Record<string, unknown>;
    if (action === "close") {
      updates = { status: "closed", accepted_proposal_id: null };
    } else if (action === "accept") {
      const proposalId = String(body?.proposalId || "").trim();
      if (!proposalId) return NextResponse.json({ ok: false, error: "proposalId is required" }, { status: 400 });
      const { data: proposal, error: proposalError } = await db
        .from("outfit_proposals")
        .select("id,request_id")
        .eq("id", proposalId)
        .eq("request_id", id)
        .maybeSingle();
      if (proposalError) throw proposalError;
      if (!proposal) return notFound(locale);
      updates = { status: "accepted", accepted_proposal_id: proposalId };
    } else {
      return NextResponse.json({ ok: false, error: outfitMessage(locale, "invalidAction") }, { status: 400 });
    }

    const { data: updated, error: updateError } = await db
      .from("outfit_requests")
      .update(updates)
      .eq("id", id)
      .eq("author_id", user.id)
      .eq("status", "open")
      .select(REQUEST_SELECT)
      .maybeSingle();
    if (updateError) throw updateError;
    if (!updated) return NextResponse.json({ ok: false, error: outfitMessage(locale, "requestAlreadyClosedByOther") }, { status: 409 });
    revalidateOpenOutfits();
    const outfitRequest = await hydrateRequestDetail(db, updated, locale);
    return NextResponse.json({ ok: true, data: { request: outfitRequest } });
  } catch (error: unknown) {
    console.error("[outfits] update failed", error);
    return NextResponse.json({ ok: false, error: outfitMessage(locale, "requestUpdateFailed") }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasValidMutationOrigin(request)) return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
  const locale = await getRequestLocale();
  try {
    assertSupabaseConfig();
    const user = await registeredUser(request);
    if (!user) return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });
    const { id } = await context.params;
    const { data, error } = await supabase!
      .from("outfit_requests")
      .delete()
      .eq("id", id)
      .eq("author_id", user.id)
      .select("id");
    if (error) throw error;
    if (!data?.length) return notFound(locale);
    revalidateOpenOutfits();
    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (error: unknown) {
    console.error("[outfits] delete failed", error);
    return NextResponse.json({ ok: false, error: outfitMessage(locale, "requestDeleteFailed") }, { status: 500 });
  }
}
