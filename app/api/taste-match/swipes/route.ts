import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { verifyRegisteredBearerToken } from "../../../../server/utils/verify-auth.js";

type SwipeRequestAction = { productId: string; decision: "like" | "pass" };
type SwipeProduct = { id: string; style_tags: unknown; human_style_tags: unknown; tag_review_status: unknown };

function getToken(request: Request) {
  return String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

export async function POST(request: Request) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });
  try {
    assertSupabaseConfig();
    const user = await verifyRegisteredBearerToken(token);
    if (!user) return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });
    const body = await request.json();
    const profile = body?.profile;
    const actions: SwipeRequestAction[] = Array.isArray(body?.actions) ? body.actions.slice(0, 50) : [];
    if (!profile || typeof profile !== "object" || !profile.signals || !actions.length || actions.some((item) => !item || typeof item.productId !== "string" || !["like", "pass"].includes(item.decision))) {
      return NextResponse.json({ ok: false, error: "invalid taste swipe" }, { status: 400 });
    }
    const productIds = [...new Set(actions.map((item) => item.productId))];
    const { data: products, error: productError } = await supabase!.from("products").select("id,style_tags,human_style_tags,tag_review_status").in("id", productIds);
    if (productError) throw productError;
    const byId = new Map<string, SwipeProduct>((products || []).map((product: SwipeProduct) => [String(product.id), product]));
    const events = actions.filter((item) => byId.has(item.productId)).map((item) => {
      const product = byId.get(item.productId)!;
      const tagSnapshot = ["approved", "edited"].includes(String(product.tag_review_status)) && product.human_style_tags ? product.human_style_tags : product.style_tags;
      return { user_id: user.id, product_id: item.productId, decision: item.decision, tag_snapshot: tagSnapshot || {} };
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
