"use client";

import posthog from "posthog-js";

let initialized = false;

export function startSessionReplay(distinctId: string) {
  if (!distinctId || typeof window === "undefined") return;
  if (!initialized) {
    initialized = true;
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
  }
  posthog.identify(distinctId);
  posthog.startSessionRecording({ sampling: true });
}

export function stopSessionReplay() {
  if (initialized) posthog.stopSessionRecording();
}
