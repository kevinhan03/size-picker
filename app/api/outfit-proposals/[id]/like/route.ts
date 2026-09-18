import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../../../server/lib/supabase.js";
import { getRegisteredRequestUser, hasValidMutationOrigin } from "../../../../../server/auth/request-user";

async function setLike(request: Request, context: { params: Promise<{ id: string }> }, active: boolean) {
  if (!hasValidMutationOrigin(request)) return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const user = await getRegisteredRequestUser(request);
    if (!user) return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });

    const { id } = await context.params;
    const { data: proposal, error: proposalError } = await db
      .from("outfit_proposals")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (proposalError) throw proposalError;
    if (!proposal) return NextResponse.json({ ok: false, error: "proposal not found" }, { status: 404 });

    const result = active
      ? await db
        .from("outfit_proposal_likes")
        .upsert({ user_id: user.id, proposal_id: id }, { onConflict: "user_id,proposal_id", ignoreDuplicates: true })
      : await db
        .from("outfit_proposal_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("proposal_id", id);
    if (result.error) throw result.error;

    const { count, error: countError } = await db
      .from("outfit_proposal_likes")
      .select("proposal_id", { count: "exact", head: true })
      .eq("proposal_id", id);
    if (countError) throw countError;
    return NextResponse.json({ ok: true, data: { active, likeCount: count || 0 } });
  } catch (error: unknown) {
    console.error("[outfits] proposal like update failed", error);
    return NextResponse.json({ ok: false, error: "proposal like update failed" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return setLike(request, context, true);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return setLike(request, context, false);
}
