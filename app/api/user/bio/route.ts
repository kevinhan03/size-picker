import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { getRegisteredRequestUser, hasValidMutationOrigin } from "../../../../server/auth/request-user";

const unauthorized = (msg = "authorization token is required") =>
  NextResponse.json({ ok: false, error: msg }, { status: 401 });

export async function PATCH(request: Request) {
  if (!hasValidMutationOrigin(request)) {
    return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
  }

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const user = await getRegisteredRequestUser(request);
    if (!user) return unauthorized("registered account required");

    const body = await request.json();
    const bio = String(body?.bio ?? "").slice(0, 160);

    const { error } = await db
      .from("users")
      .update({ bio })
      .eq("id", user.id);

    if (error) throw error;

    return NextResponse.json({ ok: true, data: { bio } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "bio update error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
