"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { flushPendingAnalyticsEvents } from "../utils/analytics";

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (pathname) {
      const url = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      ph.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, ph]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [isPostHogReady, setIsPostHogReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const initialize = () => {
      if (cancelled) return;
      if (!posthog.__loaded) {
        posthog.init("phc_vU4zvKHs7soZFJmRNncFAxT2asm4pCDnMWByEZWrabXC", {
          api_host: "https://us.i.posthog.com",
          capture_pageview: false,
          capture_pageleave: true,
          disable_session_recording: true,
          disable_surveys: true,
        });
      }

      flushPendingAnalyticsEvents();
      setIsPostHogReady(true);
    };

    const fallbackTimer = window.setTimeout(initialize, 2000);
    const idleCallback = "requestIdleCallback" in window
      ? window.requestIdleCallback(initialize, { timeout: 1800 })
      : null;

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      if (idleCallback !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallback);
      }
    };
  }, []);

  return (
    <PHProvider client={posthog}>
      {isPostHogReady ? (
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
      ) : null}
      {children}
    </PHProvider>
  );
}
