import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { normalizeUsername, validateUsername } from "@/utils/username";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { getRequestAuthUser, hasValidMutationOrigin } from "../../../../server/auth/request-user";

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request body" }, { status: 400 });
  }

  const username = normalizeUsername((body as Record<string, unknown> | null)?.username);
  const validationError = validateUsername(username);
  if (validationError) return NextResponse.json({ ok: false, error: validationError }, { status: 400 });

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const user = await getRequestAuthUser(request);
    if (!user) return NextResponse.json({ ok: false, error: "invalid auth session" }, { status: 401 });

    const { data, error } = await db.rpc("set_user_username", {
      p_user_id: user.id,
      p_username: username,
      p_allow_rename: false,
    });
    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : null;
    if (!result?.username) throw new Error("complete-profile returned no username");

    return NextResponse.json(
      { ok: true, data: { username: String(result.username) } },
      { status: result.changed ? 201 : 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "complete-profile error") },
      { status: getErrorStatusCode(error) }
    );
  }
}
