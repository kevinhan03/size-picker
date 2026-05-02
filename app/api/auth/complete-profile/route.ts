import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { normalizeUsername, validateUsername } from "@/utils/username";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";

const getToken = (request: Request) =>
  String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();

export async function POST(request: Request) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ ok: false, error: "authorization token is required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request body" }, { status: 400 });
  }

  const username = normalizeUsername((body as Record<string, unknown> | null)?.username);
  const validationError = validateUsername(username);
  if (validationError) {
    return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
  }

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const {
      data: { user },
      error: userError,
    } = await db.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: userError?.message || "invalid auth token" }, { status: 401 });
    }

    const { data: currentProfile, error: currentProfileError } = await db
      .from("users")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    if (currentProfileError) throw currentProfileError;
    if (currentProfile?.username) {
      return NextResponse.json({ ok: true, data: { username: String(currentProfile.username) } });
    }

    const { data: existingUsername, error: existingUsernameError } = await db
      .from("users")
      .select("id")
      .ilike("username", username)
      .maybeSingle();
    if (existingUsernameError) throw existingUsernameError;
    if (existingUsername) {
      return NextResponse.json({ ok: false, error: "이미 사용 중인 계정이름입니다." }, { status: 409 });
    }

    const { error: insertError } = await db.from("users").insert({ id: user.id, username });
    if (insertError) {
      if (insertError.code === "23505") {
        const { data: racedProfile, error: racedProfileError } = await db
          .from("users")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();
        if (racedProfileError) throw racedProfileError;
        if (racedProfile?.username) {
          return NextResponse.json({ ok: true, data: { username: String(racedProfile.username) } });
        }
        return NextResponse.json({ ok: false, error: "이미 사용 중인 계정이름입니다." }, { status: 409 });
      }
      throw insertError;
    }

    return NextResponse.json({ ok: true, data: { username } }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "complete-profile error") },
      { status: getErrorStatusCode(error) }
    );
  }
}
