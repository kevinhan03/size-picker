import { NextResponse } from "next/server";
import { getRequestAuthUserId, hasValidMutationOrigin } from "../../../../server/auth/request-user";
import { identifyAnalyticsUser } from "../../../../server/lib/analytics";

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  try {
    const { anonymousId } = await request.json() as { anonymousId?: unknown };
    const user = await getRequestAuthUserId(request);
    if (typeof anonymousId !== "string" || !/^[0-9a-f-]{20,80}$/i.test(anonymousId) || !user) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await identifyAnalyticsUser(anonymousId, user.id);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  }
}
