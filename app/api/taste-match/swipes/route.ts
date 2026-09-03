import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { getRegisteredRequestUser, hasValidMutationOrigin } from "../../../../server/auth/request-user";
import type { Product } from "../../../../src/types";
import { getProductStyleProfile, STYLE_PROFILE_VERSION } from "../../../../src/utils/styleProfile";

type SwipeRequestAction = { productId: string; decision: "like" | "pass" };
type SwipeProduct = {
  id: string;
  style_axes: unknown;
  human_style_axes: unknown;
  style_axes_reviewed_at: string | null;
  target_gender: Product["targetGender"];
  human_target_gender: Product["humanTargetGender"];
};

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
  try {
    assertSupabaseConfig();
    const user = await getRegisteredRequestUser(request);
    if (!user) return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });
    const body = await request.json();
    const profile = body?.profile;
    const actions: SwipeRequestAction[] = Array.isArray(body?.actions) ? body.actions.slice(0, 50) : [];
    if (!profile || typeof profile !== "object" || Number(profile.version) !== 2 || !profile.signals || !actions.length || actions.some((item) => !item || typeof item.productId !== "string" || !["like", "pass"].includes(item.decision))) {
      return NextResponse.json({ ok: false, error: "invalid taste swipe" }, { status: 400 });
    }
    const productIds = [...new Set(actions.map((item) => item.productId))];
    const { data: products, error: productError } = await supabase!
      .from("products")
      .select("id,style_axes,human_style_axes,style_axes_reviewed_at,target_gender,human_target_gender")
      .in("id", productIds);
    if (productError) throw productError;
    const byId = new Map<string, SwipeProduct>((products || []).map((product: SwipeProduct) => [String(product.id), product]));
    const events = actions.filter((item) => byId.has(item.productId)).map((item) => {
      const product = byId.get(item.productId)!;
      const styleProfile = getProductStyleProfile({
        id: product.id,
        styleAxes: product.style_axes,
        humanStyleAxes: product.human_style_axes,
        styleAxesReviewedAt: product.style_axes_reviewed_at,
        targetGender: product.target_gender,
        humanTargetGender: product.human_target_gender,
      } as Product);
      return {
        user_id: user.id,
        product_id: item.productId,
        decision: item.decision,
        style_profile_snapshot: styleProfile
          ? { entries: styleProfile.entries, source: styleProfile.source, axes: styleProfile.axes }
          : null,
        style_profile_version: styleProfile?.version || STYLE_PROFILE_VERSION,
      };
    });
    if (!events.length) return NextResponse.json({ ok: false, error: "products not found" }, { status: 400 });
    const { error: profileError } = await supabase!.from("user_taste_profiles").upsert({ user_id: user.id, profile, completed_sessions: Math.max(0, Number(profile.completedSessions || 0)), updated_at: new Date().toISOString() });
    if (profileError) throw profileError;
    const { error: eventError } = await supabase!.from("user_taste_swipe_events").insert(events);
    if (eventError) throw eventError;
    return NextResponse.json({ ok: true, data: { saved: events.length } });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "taste swipe save error" }, { status: 500 });
  }
}
