"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface PresenceOptions {
  enterDuration?: number;
  exitDuration?: number;
  onExitComplete?: () => void;
}

/** Keeps a layer mounted long enough for its exit transition to finish. */
export function usePresence(isOpen: boolean, options: PresenceOptions = {}) {
  const { enterDuration = 220, exitDuration = 160, onExitComplete } = options;
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterFrames = useRef<number[]>([]);

  const clearExitTimer = useCallback(() => {
    if (exitTimer.current) {
      clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }
  }, []);

  const clearEnterFrames = useCallback(() => {
    enterFrames.current.forEach((frame) => cancelAnimationFrame(frame));
    enterFrames.current = [];
  }, []);

  useEffect(() => {
    clearExitTimer();
    clearEnterFrames();
    if (isOpen) {
      setIsMounted(true);
      // The first frame must paint the hidden state. A single rAF can run before
      // React has committed that state, which makes the layer jump to its final position.
      const mountFrame = requestAnimationFrame(() => {
        const visibleFrame = requestAnimationFrame(() => setIsVisible(true));
        enterFrames.current = [visibleFrame];
      });
      enterFrames.current = [mountFrame];
      return () => {
        clearEnterFrames();
      };
    }

    setIsVisible(false);
    exitTimer.current = setTimeout(() => {
      setIsMounted(false);
      onExitComplete?.();
    }, exitDuration);

    return () => {
      clearExitTimer();
      clearEnterFrames();
    };
  }, [clearEnterFrames, clearExitTimer, exitDuration, isOpen, onExitComplete]);

  const requestClose = useCallback((close: () => void) => {
    setIsVisible(false);
    window.setTimeout(close, exitDuration);
  }, [exitDuration]);

  return { isMounted, isVisible, requestClose, enterDuration, exitDuration };
}
