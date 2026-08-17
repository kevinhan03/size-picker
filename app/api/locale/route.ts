import { NextResponse } from "next/server";
import { LOCALE_COOKIE_NAME, getLocale, isLocale } from "@/i18n/locale";
import { hasValidMutationOrigin } from "../../../server/auth/request-user";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) {
    return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
  }

  let body: { locale?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request body" }, { status: 400 });
  }
  if (!isLocale(body.locale)) {
    return NextResponse.json({ ok: false, error: "unsupported locale" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, data: { locale: getLocale(body.locale) } });
  response.cookies.set(LOCALE_COOKIE_NAME, body.locale, {
    httpOnly: true,
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
