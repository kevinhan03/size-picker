import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { getRequestAuthUser, hasValidMutationOrigin } from "../../../../server/auth/request-user";

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });

  try {
    assertSupabaseConfig();
    const db = supabase!;

    const user = await getRequestAuthUser(request);
    if (!user) return NextResponse.json({ ok: false, error: "invalid auth session" }, { status: 401 });

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
