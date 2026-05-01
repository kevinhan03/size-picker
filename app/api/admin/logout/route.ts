import { NextResponse } from "next/server";
import { clearAdminCookie } from "../../../../server/auth/admin-session.js";
import { verifyAdminRequest } from "../../../../server/utils/admin-request.js";

export async function POST(request: Request) {
  const adminError = verifyAdminRequest(request);
  if (adminError) return adminError;

  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", clearAdminCookie());
  return response;
}
