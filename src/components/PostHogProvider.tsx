"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { captureEvent, getAnonymousAnalyticsId, identifyAnalyticsUser, initializeAnalytics } from "../utils/analytics";
import { startSessionReplay, stopSessionReplay } from "../utils/sessionReplay";

function AnalyticsIdentityBridge() {
  const { authUser, isAuthLoading } = useAuthContext();
  const pathname = usePathname();
  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      stopSessionReplay();
      return;
    }
    if (isAuthLoading) return;
    const syncIdentity = async () => {
      if (authUser) await identifyAnalyticsUser();
      const response = await fetch("/api/analytics/identity", { cache: "no-store", credentials: "same-origin" });
      const payload = await response.json() as { distinctId?: string | null };
      startSessionReplay(payload.distinctId || getAnonymousAnalyticsId());
    };
    void syncIdentity();
  }, [authUser, isAuthLoading, pathname]);
  return null;
}

function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) captureEvent("page_viewed", { page_path: pathname });
  }, [pathname]);
  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => initializeAnalytics(), []);
  return <><AnalyticsIdentityBridge /><PageViewTracker />{children}</>;
}
