import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";

const unauthorized = (msg = "authorization token is required") =>
  NextResponse.json({ ok: false, error: msg }, { status: 401 });

function getToken(request: Request) {
  return String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

export async function PATCH(request: Request) {
  const token = getToken(request);
  if (!token) return unauthorized();

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) return unauthorized(authError?.message || "invalid token");

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
