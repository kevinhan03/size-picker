import posthog from "posthog-js";

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export function captureEvent(name: string, properties: AnalyticsProperties = {}) {
  if (typeof window === "undefined") return;
  posthog.capture(name, properties);
}
