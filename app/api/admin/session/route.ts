import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import {
  ADMIN_PASSWORD,
  assertAdminConfig,
  getAdminTokenFromCookieHeader,
  verifyAdminSessionToken,
} from "../../../../server/auth/admin-session.js";

export async function GET(request: Request) {
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

  const token = getAdminTokenFromCookieHeader(request.headers.get("cookie") ?? "");
  const authenticated = Boolean(ADMIN_PASSWORD) && verifyAdminSessionToken(token);

  return NextResponse.json({
    ok: true,
    data: { authenticated },
  });
}
