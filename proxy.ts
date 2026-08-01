import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const TRACKING_PARAMS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "fbclid", "gclid", "igshid", "_ga", "_gl",
];

export async function proxy(request: NextRequest) {
  const hasTracking = TRACKING_PARAMS.some((param) => request.nextUrl.searchParams.has(param));
  if (hasTracking) {
    const cleanUrl = request.nextUrl.clone();
    TRACKING_PARAMS.forEach((param) => cleanUrl.searchParams.delete(param));
    for (const key of [...cleanUrl.searchParams.keys()]) {
      if (key.startsWith("aem_")) cleanUrl.searchParams.delete(key);
    }
    if ([...cleanUrl.searchParams.keys()].length === 0) cleanUrl.search = "";
    return NextResponse.redirect(cleanUrl, { status: 301 });
  }

  const hasAuthCookie = request.cookies.getAll().some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!hasAuthCookie || !url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        response.headers.set("Cache-Control", "private, no-store");
      },
    },
  });
  await client.auth.getClaims();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
    "/api/closet/:path*",
    "/api/digbox/:path*",
    "/api/user/bio",
    "/api/auth/:path*",
    "/api/my-sizes/:path*",
    "/api/my-discoveries",
    "/api/outfit-requests/:path*",
    "/api/outfit-proposals/:path*",
    "/api/taste-match/:path*",
    "/api/uploads/:path*",
  ],
};
