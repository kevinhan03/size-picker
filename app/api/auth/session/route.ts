import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { getRequestAuthUser } from "../../../../server/auth/request-user";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";

const noStoreHeaders = (duration: number) => ({
  "Cache-Control": "private, no-store",
  "Server-Timing": `auth;dur=${duration}`,
});

export async function GET(request: Request) {
  const startedAt = performance.now();
  try {
    const user = await getRequestAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { ok: true, data: { user: null, username: null, needsUsername: false } },
        { headers: noStoreHeaders(Math.round(performance.now() - startedAt)) }
      );
    }

    assertSupabaseConfig();
    const { data: profile, error } = await supabase!
      .from("users")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;

    const username = profile?.username ? String(profile.username) : null;
    return NextResponse.json(
      {
        ok: true,
        data: {
          user: { id: user.id, email: user.email },
          username,
          needsUsername: !username,
        },
      },
      { headers: noStoreHeaders(Math.round(performance.now() - startedAt)) }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "auth session error") },
      {
        status: getErrorStatusCode(error),
        headers: noStoreHeaders(Math.round(performance.now() - startedAt)),
      }
    );
  }
}
