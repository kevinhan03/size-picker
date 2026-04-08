import { NextRequest, NextResponse } from "next/server";

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "igshid",
  "_ga",
  "_gl",
];

export function proxy(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const hasTracking = TRACKING_PARAMS.some((param) => searchParams.has(param));
  if (!hasTracking) return NextResponse.next();

  const cleanUrl = request.nextUrl.clone();
  TRACKING_PARAMS.forEach((param) => cleanUrl.searchParams.delete(param));

  // Remove aem_* params (added by Meta)
  for (const key of [...cleanUrl.searchParams.keys()]) {
    if (key.startsWith("aem_")) cleanUrl.searchParams.delete(key);
  }

  // If no params remain, use bare pathname
  const hasRemainingParams = [...cleanUrl.searchParams.keys()].length > 0;
  if (!hasRemainingParams) {
    cleanUrl.search = "";
  }

  return NextResponse.redirect(cleanUrl, { status: 301 });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
