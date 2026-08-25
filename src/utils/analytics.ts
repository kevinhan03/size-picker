export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

type PendingAnalyticsEvent = { name: string; properties: AnalyticsProperties };

const ANONYMOUS_ID_KEY = "digbox:analytics:anonymous-id:v1";
const VISIT_COUNT_KEY = "digbox:analytics:visit-count:v1";
const SESSION_ID_KEY = "digbox:analytics:session-id:v1";
const MAX_PENDING_EVENTS = 100;
const pendingEvents: PendingAnalyticsEvent[] = [];
let ready = false;

const createId = () => crypto.randomUUID();

export function getAnonymousAnalyticsId() {
  if (typeof window === "undefined") return "";
  let value = window.localStorage.getItem(ANONYMOUS_ID_KEY);
  if (!value) {
    value = createId();
    window.localStorage.setItem(ANONYMOUS_ID_KEY, value);
  }
  return value;
}

function getSessionId() {
  let value = window.sessionStorage.getItem(SESSION_ID_KEY);
  if (!value) {
    value = createId();
    window.sessionStorage.setItem(SESSION_ID_KEY, value);
  }
  return value;
}

function getVisitorState() {
  return Number(window.localStorage.getItem(VISIT_COUNT_KEY) || "0") > 1 ? "returning" : "new";
}

async function send(name: string, properties: AnalyticsProperties) {
  try {
    await fetch("/api/analytics", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: name, anonymousId: getAnonymousAnalyticsId(), sessionId: getSessionId(), visitorState: getVisitorState(), properties }),
      keepalive: true,
    });
  } catch {
    // Analytics must not affect the product experience.
  }
}

export function initializeAnalytics() {
  if (typeof window === "undefined" || ready) return;
  ready = true;
  const previous = Number(window.localStorage.getItem(VISIT_COUNT_KEY) || "0");
  window.localStorage.setItem(VISIT_COUNT_KEY, String(previous + 1));
  pendingEvents.splice(0).forEach(({ name, properties }) => void send(name, properties));
}

export function captureEvent(name: string, properties: AnalyticsProperties = {}) {
  if (typeof window === "undefined") return;
  if (!ready) {
    if (pendingEvents.length < MAX_PENDING_EVENTS) pendingEvents.push({ name, properties });
    return;
  }
  void send(name, properties);
}

export async function identifyAnalyticsUser() {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/analytics/identify", {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonymousId: getAnonymousAnalyticsId() }), keepalive: true,
    });
  } catch {
    // Authentication remains successful when analytics is unavailable.
  }
}

export function resetAnalyticsIdentity() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ANONYMOUS_ID_KEY, createId());
  window.sessionStorage.setItem(SESSION_ID_KEY, createId());
}
