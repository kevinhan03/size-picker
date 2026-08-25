import { createHmac } from "node:crypto";

type Scalar = string | number | boolean | null;
type AnalyticsPayloadProperties = Record<string, Scalar | Record<string, Scalar>>;

const POSTHOG_CAPTURE_URL = "https://us.i.posthog.com/capture/";
const FORBIDDEN_PROPERTY = /(?:email|password|token|secret|username|query|search_term|content|message|bio|image|url)/i;

function configured() {
  return Boolean(process.env.POSTHOG_API_KEY && process.env.ANALYTICS_USER_HASH_SECRET);
}

export function analyticsUserId(userId: string) {
  const secret = process.env.ANALYTICS_USER_HASH_SECRET;
  if (!secret) throw new Error("ANALYTICS_USER_HASH_SECRET is not configured");
  return `user_${createHmac("sha256", secret).update(userId).digest("hex")}`;
}

export function sanitizeAnalyticsProperties(value: unknown): Record<string, Scalar> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value).reduce<Record<string, Scalar>>((safe, [key, raw]) => {
    if (!/^[a-z][a-z0-9_]{0,63}$/i.test(key) || FORBIDDEN_PROPERTY.test(key)) return safe;
    if (typeof raw === "string") {
      if (raw.length <= 160) safe[key] = raw;
    } else if (typeof raw === "number" && Number.isFinite(raw)) {
      safe[key] = raw;
    } else if (typeof raw === "boolean" || raw === null) {
      safe[key] = raw;
    }
    return safe;
  }, {});
}

export async function captureAnalyticsEvent(event: string, distinctId: string, properties: AnalyticsPayloadProperties) {
  if (!configured() || !(event === "$identify" || /^[a-z][a-z0-9_]{0,80}$/i.test(event))) return;
  await fetch(POSTHOG_CAPTURE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: process.env.POSTHOG_API_KEY, event, properties: { distinct_id: distinctId, ...properties } }),
    cache: "no-store",
  });
}

export async function identifyAnalyticsUser(anonymousId: string, userId: string) {
  if (!configured()) return;
  const distinctId = analyticsUserId(userId);
  await captureAnalyticsEvent("$identify", distinctId, {
    $anon_distinct_id: anonymousId,
    $set: { is_authenticated: true, analytics_user_id: distinctId },
  });
}
