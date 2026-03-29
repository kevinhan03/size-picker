import { NextResponse } from "next/server";
import {
  getAdminTokenFromCookieHeader,
  verifyAdminSessionToken,
} from "../../../../server/auth/admin-session.js";
import { ADMIN_PASSWORD, assertAdminConfig } from "../../../../server/shared.js";

export async function GET(request: Request) {
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

  const token = getAdminTokenFromCookieHeader(request.headers.get("cookie") ?? "");
  const authenticated = Boolean(ADMIN_PASSWORD) && verifyAdminSessionToken(token);

  return NextResponse.json({
    ok: true,
    data: { authenticated },
  });
}
