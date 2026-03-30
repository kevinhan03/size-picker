import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import {
  ADMIN_PASSWORD,
  assertAdminConfig,
  makeAdminCookie,
  makeAdminSessionToken,
  safeCompare,
} from "../../../../server/auth/admin-session.js";

export async function POST(request: Request) {
  const body = await request.json();
  const password = String(body?.password || "");

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
