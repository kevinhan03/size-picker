import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { assertSupabaseConfig, supabase } from "../../../../../server/lib/supabase.js";
import { getUsernameSuggestions } from "../../../../../server/utils/username.js";

const getToken = (request: Request) =>
  String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();

export async function GET(request: Request) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ ok: false, error: "authorization token is required" }, { status: 401 });

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const { data: { user }, error: userError } = await db.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ ok: false, error: userError?.message || "invalid auth token" }, { status: 401 });
    }
    const suggestions = await getUsernameSuggestions(db, String(user.email || ""), String(user.id));
    return NextResponse.json({ ok: true, data: { suggestions } });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error, "username suggestions error") }, { status: getErrorStatusCode(error) });
  }
}
