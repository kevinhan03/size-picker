"use client";

import type { PostHog } from "posthog-js";

let client: PostHog | null = null;
let loading: Promise<PostHog> | null = null;

async function getClient() {
  if (client) return client;
  loading ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init("server-proxy-managed", {
      api_host: "/_dbx",
      asset_host: "https://us-assets.i.posthog.com",
      capture_pageview: false,
      autocapture: false,
      advanced_disable_feature_flags: true,
      session_recording: {
        maskAllInputs: true,
        maskAllElementAttributes: true,
        maskTextSelector: "[data-private], .ph-mask",
      },
    });
    client = posthog;
    return posthog;
  });
  return loading;
}

export async function startSessionReplay(distinctId: string) {
  if (!distinctId || typeof window === "undefined") return;
  const posthog = await getClient();
  posthog.identify(distinctId);
  posthog.startSessionRecording();
}

export function stopSessionReplay() {
  client?.stopSessionRecording();
}
