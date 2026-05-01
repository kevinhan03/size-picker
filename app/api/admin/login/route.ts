import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import {
  ADMIN_PASSWORD,
  assertAdminConfig,
  makeAdminCookie,
  makeAdminSessionToken,
  safeCompare,
} from "../../../../server/auth/admin-session.js";

const LOGIN_ATTEMPT_WINDOW_MS = 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 8;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const getClientKey = (request: Request) =>
  String(
    request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown"
  )
    .split(",")[0]
    .trim();

const isAllowedOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
};

const isRateLimited = (request: Request) => {
  const key = getClientKey(request);
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_ATTEMPT_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_LOGIN_ATTEMPTS;
};

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  if (isRateLimited(request)) {
    return NextResponse.json({ ok: false, error: "too many login attempts" }, { status: 429 });
  }

  let password = "";
  try {
    const body = await request.json();
    password = String(body?.password || "");
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request body" }, { status: 400 });
  }

  try {
    assertAdminConfig();
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error, "admin config missing"),
      },
      { status: getErrorStatusCode(error) }
    );
  }

  if (!safeCompare(password, ADMIN_PASSWORD)) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid admin credentials",
      },
      { status: 401 }
    );
  }

  const token = makeAdminSessionToken();
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", makeAdminCookie(token));
  return response;
}
