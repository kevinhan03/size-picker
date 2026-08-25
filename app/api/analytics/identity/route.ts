import { NextResponse } from "next/server";
import { getRequestAuthUserId } from "../../../../server/auth/request-user";
import { analyticsUserId } from "../../../../server/lib/analytics";

export async function GET(request: Request) {
  try {
    const user = await getRequestAuthUserId(request);
    return NextResponse.json(
      { distinctId: user ? analyticsUserId(user.id) : null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ distinctId: null }, { headers: { "Cache-Control": "no-store" } });
  }
}
