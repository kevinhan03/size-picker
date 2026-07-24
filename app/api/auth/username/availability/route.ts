import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { assertSupabaseConfig, supabase } from "../../../../../server/lib/supabase.js";
import { isUsernameAvailable, normalizeUsername, validateUsername } from "../../../../../server/utils/username.js";

const getToken = (request: Request) =>
  String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();

export async function GET(request: Request) {
  const token = getToken(request);

  const username = normalizeUsername(new URL(request.url).searchParams.get("username"));
  const validationError = validateUsername(username);
  if (validationError) return NextResponse.json({ ok: true, data: { available: false, reason: validationError } });

  try {
    assertSupabaseConfig();
    const db = supabase!;
    let currentUserId: string | null = null;
    if (token) {
      const { data: { user }, error: userError } = await db.auth.getUser(token);
      if (userError || !user) {
        return NextResponse.json({ ok: false, error: userError?.message || "invalid auth token" }, { status: 401 });
      }
      currentUserId = String(user.id);
    }
    const available = await isUsernameAvailable(db, username, currentUserId);
    return NextResponse.json({ ok: true, data: { available, reason: available ? null : "이미 사용 중인 사용자 이름이에요." } });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error, "username availability error") }, { status: getErrorStatusCode(error) });
  }
}
