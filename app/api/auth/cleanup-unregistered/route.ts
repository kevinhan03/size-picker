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

    if (String(user.app_metadata?.provider || "") !== "google") {
      return NextResponse.json({
        ok: true,
        data: { deleted: false, registered: false, eligible: false },
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
