import { NextResponse } from "next/server";
import { getRegisteredRequestUser } from "../../../../server/auth/request-user";
import { getFeedbackProfile } from "../../../../server/services/fashion-agent/feedback";
export async function GET(request: Request) {
  const user = await getRegisteredRequestUser(request);
  if (!user)
    return NextResponse.json(
      { ok: false, error: "login_required" },
      { status: 401 }
    );
  try {
    const profile = await getFeedbackProfile(user.id);
    return NextResponse.json(
      { ok: true, data: { total: profile.total, reasons: profile.reasons } },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "feedback_unavailable" },
      { status: 503 }
    );
  }
}
