import { NextResponse } from "next/server";
import { getRequestAuthUserId, hasValidMutationOrigin } from "../../../server/auth/request-user";
import { analyticsUserId, captureAnalyticsEvent, sanitizeAnalyticsProperties } from "../../../server/lib/analytics";

const validId = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f-]{20,80}$/i.test(value);

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const event = body.event;
    const anonymousId = body.anonymousId;
    const sessionId = body.sessionId;
    if (typeof event !== "string" || !validId(anonymousId) || !validId(sessionId)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const user = await getRequestAuthUserId(request);
    const distinctId = user ? analyticsUserId(user.id) : anonymousId;
    const visitorState = body.visitorState === "returning" ? "returning" : "new";
    const now = new Date().toISOString();
    const activationProperties: Record<string, string | boolean> = {};
    if (event === "save_succeeded") activationProperties.has_saved = true;
    if (event === "taste_swipe_completed") activationProperties.has_completed_taste = true;
    if (event === "dig_match_completed") activationProperties.has_completed_dig_match = true;
    await captureAnalyticsEvent(event, distinctId, {
      ...sanitizeAnalyticsProperties(body.properties),
      session_id: sessionId,
      visitor_state: visitorState,
      is_authenticated: Boolean(user),
      $set: { is_authenticated: Boolean(user), last_seen_at: now, ...activationProperties },
      $set_once: { first_seen_at: now, first_visitor_state: visitorState },
    });
  } catch {
    // Analytics failures are intentionally invisible to product requests.
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
