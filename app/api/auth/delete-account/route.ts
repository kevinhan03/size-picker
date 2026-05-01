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

    const { error: deleteAuthError } = await db.auth.admin.deleteUser(user.id);
    if (deleteAuthError) throw deleteAuthError;

    const cleanupQueries = [
      db.from("user_closet_items").delete().eq("user_id", user.id),
      db.from("user_digbox_items").delete().eq("user_id", user.id),
      db.from("user_my_size_profiles").delete().eq("user_id", user.id),
      db.from("users").delete().eq("id", user.id),
    ];
    const cleanupResults = await Promise.allSettled(cleanupQueries);
    const cleanupError = cleanupResults.find(
      (result) => result.status === "fulfilled" && result.value.error
    );
    if (cleanupError && cleanupError.status === "fulfilled") {
      throw cleanupError.value.error;
    }
    const rejectedCleanup = cleanupResults.find((result) => result.status === "rejected");
    if (rejectedCleanup && rejectedCleanup.status === "rejected") {
      throw rejectedCleanup.reason;
    }

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
