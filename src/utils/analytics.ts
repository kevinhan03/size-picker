import posthog from "posthog-js";

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;
type PendingAnalyticsEvent = {
  name: string;
  properties: AnalyticsProperties;
};

const MAX_PENDING_EVENTS = 100;
const pendingEvents: PendingAnalyticsEvent[] = [];

export function captureEvent(name: string, properties: AnalyticsProperties = {}) {
  if (typeof window === "undefined") return;
  if (!posthog.__loaded) {
    if (pendingEvents.length < MAX_PENDING_EVENTS) {
      pendingEvents.push({ name, properties });
    }
    return;
  }
  posthog.capture(name, properties);
}

export function flushPendingAnalyticsEvents() {
  if (!posthog.__loaded) return;
  pendingEvents.splice(0).forEach(({ name, properties }) => {
    posthog.capture(name, properties);
  });
}
