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

    // All public user data is deleted by database cascades. The profile deletion
    // trigger also anonymizes products in the same transaction as auth deletion.
    const { error: deleteAuthError } = await db.auth.admin.deleteUser(user.id);
    if (deleteAuthError) throw deleteAuthError;

    return NextResponse.json({
      ok: true,
      data: { deleted: true },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "delete-account error") },
      { status: getErrorStatusCode(error) }
    );
  }
}
