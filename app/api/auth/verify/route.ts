import { authNoStoreJson, copyCookies, createAuthRouteClient, isSameOrigin } from "../../../../server/auth/route-client";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { normalizeUsername, validateUsername } from "../../../../src/utils/username";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return authNoStoreJson({ ok: false, error: "invalid origin" }, { status: 403 });
  const response = authNoStoreJson({ ok: true });
  try {
    const body = await request.json() as { email?: string; token?: string; username?: string };
    const email = String(body.email || "").trim();
    const token = String(body.token || "").replace(/\s/g, "");
    const username = normalizeUsername(body.username);
    const usernameError = validateUsername(username);
    if (!email || !token) return authNoStoreJson({ ok: false, error: "email and token are required" }, { status: 400 });
    if (usernameError) return authNoStoreJson({ ok: false, error: usernameError }, { status: 400 });
    const client = await createAuthRouteClient(response);
    const { data, error } = await client.auth.verifyOtp({ email, token, type: "signup" });
    if (error || !data.user) return authNoStoreJson({ ok: false, error: error?.message || "verification failed" }, { status: 400 });
    assertSupabaseConfig();
    const { data: result, error: profileError } = await supabase!.rpc("set_user_username", { p_user_id: data.user.id, p_username: username, p_allow_rename: false });
    if (profileError || !(Array.isArray(result) ? result[0]?.username : null)) throw profileError || new Error("profile completion failed");
    return copyCookies(response, authNoStoreJson({ ok: true, data: { user: { id: data.user.id, email: data.user.email }, username } }));
  } catch (error) {
    return authNoStoreJson({ ok: false, error: error instanceof Error ? error.message : "verification failed" }, { status: 500 });
  }
}
