import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { verifyRegisteredBearerToken } from "../../../../server/utils/verify-auth.js";
import { getBearerToken, hydrateRequestDetail } from "../../../../server/utils/outfits.js";

const REQUEST_SELECT = "id,author_id,description,status,accepted_proposal_id,created_at";
const notFound = () => NextResponse.json({ ok: false, error: "코디 요청을 찾을 수 없습니다." }, { status: 404 });

async function registeredUser(request: Request) {
  const token = getBearerToken(request);
  return token ? verifyRegisteredBearerToken(token) : null;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSupabaseConfig();
    const user = await registeredUser(request);
    if (!user) return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });
    const { id } = await context.params;
    const { data, error } = await supabase!.from("outfit_requests").select(REQUEST_SELECT).eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return notFound();
    const outfitRequest = await hydrateRequestDetail(supabase!, data);
    return NextResponse.json({ ok: true, data: { request: outfitRequest, currentUserId: user.id } });
  } catch (error: unknown) {
    console.error("[outfits] detail failed", error);
    return NextResponse.json({ ok: false, error: "코디 요청을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
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
    if (!existing) return notFound();
    if (existing.status !== "open") {
      return NextResponse.json({ ok: false, error: "이미 완료된 요청입니다." }, { status: 409 });
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
      if (!proposal) return notFound();
      updates = { status: "accepted", accepted_proposal_id: proposalId };
    } else {
      return NextResponse.json({ ok: false, error: "올바른 작업이 아닙니다." }, { status: 400 });
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
    if (!updated) return NextResponse.json({ ok: false, error: "다른 작업으로 이미 완료된 요청입니다." }, { status: 409 });
    const outfitRequest = await hydrateRequestDetail(db, updated);
    return NextResponse.json({ ok: true, data: { request: outfitRequest } });
  } catch (error: unknown) {
    console.error("[outfits] update failed", error);
    return NextResponse.json({ ok: false, error: "코디 요청 상태를 변경하지 못했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
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
    if (!data?.length) return notFound();
    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (error: unknown) {
    console.error("[outfits] delete failed", error);
    return NextResponse.json({ ok: false, error: "코디 요청을 삭제하지 못했습니다." }, { status: 500 });
  }
}
