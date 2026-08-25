"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { captureEvent, identifyAnalyticsUser, initializeAnalytics } from "../utils/analytics";

function AnalyticsIdentityBridge() {
  const { authUser, isAuthLoading } = useAuthContext();
  useEffect(() => {
    if (!isAuthLoading && authUser) void identifyAnalyticsUser();
  }, [authUser, isAuthLoading]);
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
