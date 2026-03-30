import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";

export async function POST(request: Request) {
  const authorization = String(request.headers.get("authorization") || "").trim();
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "authorization token is required" },
      { status: 401 }
    );
  }

  try {
    assertSupabaseConfig();
    const db = supabase!;

    const {
      data: { user },
      error: userError,
    } = await db.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: userError?.message || "invalid auth token" },
        { status: 401 }
      );
    }

    const { data: dbUser, error: dbUserError } = await db
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (dbUserError) throw dbUserError;
    if (dbUser) {
      return NextResponse.json({
        ok: true,
        data: { deleted: false, registered: true },
      });
    }

    const { error: deleteError } = await db.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return NextResponse.json({
      ok: true,
      data: { deleted: true, registered: false },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "cleanup-unregistered error") },
      { status: getErrorStatusCode(error) }
    );
  }
}
