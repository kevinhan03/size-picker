type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;
type PendingAnalyticsEvent = {
  name: string;
  properties: AnalyticsProperties;
};

const MAX_PENDING_EVENTS = 100;
const pendingEvents: PendingAnalyticsEvent[] = [];
type AnalyticsClient = { capture: (name: string, properties?: AnalyticsProperties) => void };
let analyticsClient: AnalyticsClient | null = null;

export function captureEvent(name: string, properties: AnalyticsProperties = {}) {
  if (typeof window === "undefined") return;
  if (!analyticsClient) {
    if (pendingEvents.length < MAX_PENDING_EVENTS) {
      pendingEvents.push({ name, properties });
    }
    return;
  }
  analyticsClient.capture(name, properties);
}

export function setAnalyticsClient(client: AnalyticsClient) {
  analyticsClient = client;
  pendingEvents.splice(0).forEach(({ name, properties }) => {
    client.capture(name, properties);
  });
}
