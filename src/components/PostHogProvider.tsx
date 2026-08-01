"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { captureEvent, setAnalyticsClient } from "../utils/analytics";

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (pathname) {
      const url = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      captureEvent("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      if (cancelled) return;
      try {
        const { default: posthog } = await import("posthog-js");
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
        setAnalyticsClient(posthog);
      } catch {
        // Analytics must never delay or break the application shell.
      }
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
    <>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </>
  );
}
