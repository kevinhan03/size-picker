"use client";

import { useEffect, useRef, useState } from "react";

export function useProgressiveList(itemCount: number, resetKey: string, batchSize = 24) {
  const [visibleCount, setVisibleCount] = useState(() => Math.min(batchSize, itemCount));
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(Math.min(batchSize, itemCount));
  }, [batchSize, itemCount, resetKey]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= itemCount) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisibleCount((count) => Math.min(itemCount, count + batchSize));
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [batchSize, itemCount, visibleCount]);

  return { visibleCount, sentinelRef };
}
