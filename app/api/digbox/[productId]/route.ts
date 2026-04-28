import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";

const unauthorized = (msg = "authorization token is required") =>
  NextResponse.json({ ok: false, error: msg }, { status: 401 });

export async function DELETE(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  const token = String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return unauthorized();

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) return unauthorized(authError?.message || "invalid token");

    const { productId } = await context.params;
    const pid = String(productId || "").trim();
    if (!pid) return NextResponse.json({ ok: false, error: "productId is required" }, { status: 400 });

    const { error } = await db
      .from("user_digbox_items")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", pid);

    if (error) throw error;

    return NextResponse.json({ ok: true, data: { removed: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "digbox remove error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
