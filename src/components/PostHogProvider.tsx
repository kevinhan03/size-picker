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
    if (!posthog.__loaded) {
      posthog.init("phc_vU4zvKHs7soZFJmRNncFAxT2asm4pCDnMWByEZWrabXC", {
        api_host: "https://us.i.posthog.com",
        capture_pageview: false,
        capture_pageleave: true,
      });
    }

    flushPendingAnalyticsEvents();
    setIsPostHogReady(true);
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
