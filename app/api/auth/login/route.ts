import { authNoStoreJson, copyCookies, createAuthRouteClient, isSameOrigin } from "../../../../server/auth/route-client";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return authNoStoreJson({ ok: false, error: "invalid origin" }, { status: 403 });
  const response = authNoStoreJson({ ok: true });
  try {
    const { email, password } = await request.json() as { email?: string; password?: string };
    if (!email?.trim() || !password) return authNoStoreJson({ ok: false, error: "email and password are required" }, { status: 400 });
    const client = await createAuthRouteClient(response);
    const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) return authNoStoreJson({ ok: false, error: error?.message || "login failed" }, { status: 401 });
    return copyCookies(response, authNoStoreJson({ ok: true, data: { user: { id: data.user.id, email: data.user.email } } }));
  } catch (error) {
    return authNoStoreJson({ ok: false, error: error instanceof Error ? error.message : "login failed" }, { status: 500 });
  }
}
