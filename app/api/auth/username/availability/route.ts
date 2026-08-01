import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { assertSupabaseConfig, supabase } from "../../../../../server/lib/supabase.js";
import { isUsernameAvailable, normalizeUsername, validateUsername } from "../../../../../server/utils/username.js";
import { getRequestAuthUser } from "../../../../../server/auth/request-user";

export async function GET(request: Request) {
  const username = normalizeUsername(new URL(request.url).searchParams.get("username"));
  const validationError = validateUsername(username);
  if (validationError) return NextResponse.json({ ok: true, data: { available: false, reason: validationError } });

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const user = await getRequestAuthUser(request);
    const currentUserId = user?.id ? String(user.id) : null;
    const available = await isUsernameAvailable(db, username, currentUserId);
    return NextResponse.json({ ok: true, data: { available, reason: available ? null : "이미 사용 중인 사용자 이름이에요." } });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error, "username availability error") }, { status: getErrorStatusCode(error) });
  }
}
