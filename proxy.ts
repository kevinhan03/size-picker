import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Public pages deliberately do not pass through here so their HTML remains CDN-cacheable.
// Protected API requests still refresh Supabase's cookie session for existing sign-ins.
export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  // Never trust a value supplied by the browser. Only this proxy can attach the
  // verified subject header consumed by protected route handlers.
  requestHeaders.delete("x-digbox-verified-user-id");
  requestHeaders.delete("x-digbox-verified-user-email");
  const hasAuthCookie = request.cookies.getAll().some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!hasAuthCookie || !url || !key) return NextResponse.next({ request: { headers: requestHeaders } });

  const pendingCookies: Array<{ name: string; value: string; options: Parameters<NextResponse["cookies"]["set"]>[2] }> = [];
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => pendingCookies.push({ name, value, options }));
      },
    },
  });
  const { data } = await client.auth.getClaims();
  const subject = typeof data?.claims?.sub === "string" ? data.claims.sub : "";
  const email = typeof data?.claims?.email === "string" ? data.claims.email : "";
  if (subject) requestHeaders.set("x-digbox-verified-user-id", subject);
  if (email) requestHeaders.set("x-digbox-verified-user-email", email);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}

export const config = {
  matcher: [
    "/api/auth/:path*",
    "/api/closet/:path*",
    "/api/digbox/:path*",
    "/api/collections/:path*",
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
