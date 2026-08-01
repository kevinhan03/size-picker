import { authNoStoreJson, copyCookies, createAuthRouteClient, isSameOrigin } from "../../../../server/auth/route-client";
import { normalizeUsername, validateUsername } from "../../../../src/utils/username";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return authNoStoreJson({ ok: false, error: "invalid origin" }, { status: 403 });
  const response = authNoStoreJson({ ok: true });
  try {
    const body = await request.json() as { email?: string; password?: string; username?: string };
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    const username = normalizeUsername(body.username);
    const usernameError = validateUsername(username);
    if (!email || !password) return authNoStoreJson({ ok: false, error: "email and password are required" }, { status: 400 });
    if (usernameError) return authNoStoreJson({ ok: false, error: usernameError }, { status: 400 });
    const client = await createAuthRouteClient(response);
    const { data, error } = await client.auth.signUp({ email, password, options: { data: { username } } });
    if (error || !data.user) return authNoStoreJson({ ok: false, error: error?.message || "signup failed" }, { status: 400 });
    return copyCookies(response, authNoStoreJson({ ok: true, data: { requiresVerification: !data.session, user: data.session ? { id: data.user.id, email: data.user.email } : null } }, { status: data.session ? 201 : 202 }));
  } catch (error) {
    return authNoStoreJson({ ok: false, error: error instanceof Error ? error.message : "signup failed" }, { status: 500 });
  }
}
