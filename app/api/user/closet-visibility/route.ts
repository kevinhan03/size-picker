import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { getRegisteredRequestUser, hasValidMutationOrigin } from "../../../../server/auth/request-user";

export async function PATCH(request: Request) {
  if (!hasValidMutationOrigin(request)) return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
  try {
    assertSupabaseConfig();
    const user = await getRegisteredRequestUser(request);
    if (!user) return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });
    const body = await request.json();
    if (typeof body?.closetIsPublic !== "boolean") return NextResponse.json({ ok: false, error: "closetIsPublic must be boolean" }, { status: 400 });
    const { error } = await supabase!.from("users").update({ closet_is_public: body.closetIsPublic }).eq("id", user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true, data: { closetIsPublic: body.closetIsPublic } });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "closet visibility update error" }, { status: 500 });
  }
}
