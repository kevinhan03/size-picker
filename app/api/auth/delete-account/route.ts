import { NextResponse } from "next/server";
import { createProductStack } from "../../../../server/bootstrap/products.js";

const { assertSupabaseConfig, supabase } = createProductStack();

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
    const db = supabase;
    if (!db) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in server .env");
    }

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

    const { error: deleteProfileError } = await db
      .from("users")
      .delete()
      .eq("id", user.id);
    if (deleteProfileError) throw deleteProfileError;

    const { error: deleteAuthError } = await db.auth.admin.deleteUser(user.id);
    if (deleteAuthError) throw deleteAuthError;

    return NextResponse.json({
      ok: true,
      data: { deleted: true },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "delete-account error" },
      { status: 500 }
    );
  }
}
