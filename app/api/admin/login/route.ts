import { NextResponse } from "next/server";
import {
  makeAdminCookie,
  makeAdminSessionToken,
  safeCompare,
} from "../../../../server/auth/admin-session.js";
import { ADMIN_PASSWORD, assertAdminConfig } from "../../../../server/shared.js";

export async function POST(request: Request) {
  const body = await request.json();
  const password = String(body?.password || "");

  try {
    assertAdminConfig();
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "admin config missing",
      },
      { status: 500 }
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
