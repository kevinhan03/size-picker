import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Public pages deliberately do not pass through here so their HTML remains CDN-cacheable.
// Protected API requests still refresh Supabase's cookie session for existing sign-ins.
export async function proxy(request: NextRequest) {
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
      },
    },
  });
  await client.auth.getClaims();
  return response;
}

export const config = {
  matcher: [
    "/api/auth/:path*",
    "/api/closet/:path*",
    "/api/digbox/:path*",
    "/api/my-sizes/:path*",
    "/api/my-discoveries",
    "/api/outfit-requests/:path*",
    "/api/outfit-proposals/:path*",
    "/api/taste-match/:path*",
    "/api/taste-analysis",
    "/api/uploads/:path*",
    "/api/products",
    "/api/product-metadata",
    "/api/product-metadata-from-image",
    "/api/size-table",
    "/api/remove-bg",
    "/api/user/bio",
  ],
};
