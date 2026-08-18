"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../contexts/AuthContext";
import { useCollectionBootstrap } from "../contexts/CollectionBootstrapContext";

export function NavigationPrefetcher() {
  const router = useRouter();
  const { authUser, dbUsername, isAuthLoading } = useAuthContext();
  const collectionBootstrap = useCollectionBootstrap();

  useEffect(() => {
    if (isAuthLoading) return;
    const paths = authUser
      ? ["/outfits", "/taste", "/closet", dbUsername ? `/u/${encodeURIComponent(dbUsername)}` : "/mypage"]
      : ["/outfits", "/saved"];
    const prefetch = () => {
      paths.forEach((path) => router.prefetch(path));
      if (authUser) void collectionBootstrap.ensure().catch(() => undefined);
    };
    const idle = "requestIdleCallback" in window
      ? window.requestIdleCallback(prefetch, { timeout: 1500 })
      : null;
    const timeout = idle === null ? window.setTimeout(prefetch, 350) : null;
    return () => {
      if (idle !== null && "cancelIdleCallback" in window) window.cancelIdleCallback(idle);
      if (timeout !== null) window.clearTimeout(timeout);
    };
  }, [authUser, collectionBootstrap, dbUsername, isAuthLoading, router]);

  return null;
}
