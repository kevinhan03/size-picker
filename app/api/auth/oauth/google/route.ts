import { NextResponse } from "next/server";
import { createAuthRouteClient } from "../../../../../server/auth/route-client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent") === "signup" ? "signup" : "login";
  const cookieResponse = NextResponse.redirect(new URL("/login", request.url));
  try {
    const client = await createAuthRouteClient(cookieResponse);
    const { data, error } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${url.origin}/auth/callback` } });
    if (error || !data.url) throw error || new Error("oauth unavailable");
    const response = NextResponse.redirect(data.url);
    for (const cookie of cookieResponse.cookies.getAll()) response.cookies.set(cookie);
    response.cookies.set("digbox_oauth_intent", intent, { httpOnly: true, sameSite: "lax", secure: url.protocol === "https:", path: "/", maxAge: 600 });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", request.url));
  }
}
