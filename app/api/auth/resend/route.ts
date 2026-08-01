import { authNoStoreJson, createAuthRouteClient, isSameOrigin } from "../../../../server/auth/route-client";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return authNoStoreJson({ ok: false, error: "invalid origin" }, { status: 403 });
  const response = authNoStoreJson({ ok: true });
  try {
    const { email } = await request.json() as { email?: string };
    if (!email?.trim()) return authNoStoreJson({ ok: false, error: "email is required" }, { status: 400 });
    const client = await createAuthRouteClient(response);
    const { error } = await client.auth.resend({ type: "signup", email: email.trim() });
    if (error) return authNoStoreJson({ ok: false, error: error.message }, { status: 400 });
    return response;
  } catch (error) {
    return authNoStoreJson({ ok: false, error: error instanceof Error ? error.message : "resend failed" }, { status: 500 });
  }
}
