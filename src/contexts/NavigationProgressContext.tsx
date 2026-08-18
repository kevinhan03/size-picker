"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type NavigationProgressValue = { startNavigation: () => void };
const NavigationProgressContext = createContext<NavigationProgressValue | null>(null);

export function NavigationProgressProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopNavigation = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setVisible(false);
  }, []);

  const startNavigation = useCallback(() => {
    if (timerRef.current || visible) return;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setVisible(true);
    }, 120);
  }, [visible]);

  useEffect(() => {
    stopNavigation();
  }, [pathname, stopNavigation]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <NavigationProgressContext.Provider value={{ startNavigation }}>
      {children}
      {visible ? <div role="status" aria-label="페이지를 불러오는 중" className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-0.5 overflow-hidden bg-orange-500/20">
        <span className="block h-full w-2/5 animate-[navigation-progress_900ms_ease-in-out_infinite] bg-orange-400 motion-reduce:animate-none" />
      </div> : null}
      <style jsx>{`@keyframes navigation-progress { from { transform: translateX(-110%); } to { transform: translateX(280%); } }`}</style>
    </NavigationProgressContext.Provider>
  );
}

export function useNavigationProgress() {
  const context = useContext(NavigationProgressContext);
  if (!context) throw new Error("useNavigationProgress must be used within NavigationProgressProvider");
  return context;
}
