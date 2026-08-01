import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { getRegisteredRequestUser, hasValidMutationOrigin } from "../../../../server/auth/request-user";

const unauthorized = (msg = "authorization token is required") =>
  NextResponse.json({ ok: false, error: msg }, { status: 401 });

export async function DELETE(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  if (!hasValidMutationOrigin(request)) {
    return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
  }

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const user = await getRegisteredRequestUser(request);
    if (!user) return unauthorized("registered account required");

    const { productId } = await context.params;
    const pid = String(productId || "").trim();
    if (!pid) return NextResponse.json({ ok: false, error: "productId is required" }, { status: 400 });

    const { error } = await db
      .from("user_closet_items")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", pid);

    if (error) throw error;

    return NextResponse.json({ ok: true, data: { removed: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "closet remove error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
