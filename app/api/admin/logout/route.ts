import { NextResponse } from "next/server";
import { clearAdminCookie } from "../../../../server/auth/admin-session.js";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", clearAdminCookie());
  return response;
}
