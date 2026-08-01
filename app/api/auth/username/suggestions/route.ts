import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { assertSupabaseConfig, supabase } from "../../../../../server/lib/supabase.js";
import { getUsernameSuggestions } from "../../../../../server/utils/username.js";
import { getRequestAuthUser } from "../../../../../server/auth/request-user";

export async function GET(request: Request) {
  try {
    assertSupabaseConfig();
    const db = supabase!;
    const user = await getRequestAuthUser(request);
    if (!user) return NextResponse.json({ ok: false, error: "invalid auth session" }, { status: 401 });
    const suggestions = await getUsernameSuggestions(db, String(user.email || ""), String(user.id));
    return NextResponse.json({ ok: true, data: { suggestions } });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error, "username suggestions error") }, { status: getErrorStatusCode(error) });
  }
}
