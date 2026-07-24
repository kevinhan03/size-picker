import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { normalizeUsername, validateUsername } from "../../../../server/utils/username.js";

const getToken = (request: Request) =>
  String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();

export async function PATCH(request: Request) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ ok: false, error: "authorization token is required" }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request body" }, { status: 400 });
  }

  const username = normalizeUsername(body.username);
  const validationError = validateUsername(username);
  if (validationError) return NextResponse.json({ ok: false, error: validationError }, { status: 400 });

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const { data: { user }, error: userError } = await db.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ ok: false, error: userError?.message || "invalid auth token" }, { status: 401 });
    }
    const { data, error } = await db.rpc("set_user_username", {
      p_user_id: user.id,
      p_username: username,
      p_allow_rename: true,
    });
    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : null;
    if (!result?.username) throw new Error("username change returned no username");
    return NextResponse.json({ ok: true, data: { username: String(result.username), changed: Boolean(result.changed) } });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error, "username change error") }, { status: getErrorStatusCode(error) });
  }
}
