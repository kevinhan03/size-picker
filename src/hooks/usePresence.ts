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
  const closeTimer = useRef<number | null>(null);
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

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  useEffect(() => {
    clearExitTimer();
    clearCloseTimer();
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
        clearCloseTimer();
        clearEnterFrames();
      };
    }

    setIsVisible(false);
    exitTimer.current = setTimeout(() => {
      setIsMounted(false);
      onExitComplete?.();
    }, exitDuration);

    return () => {
      clearCloseTimer();
      clearExitTimer();
      clearEnterFrames();
    };
  }, [clearCloseTimer, clearEnterFrames, clearExitTimer, exitDuration, isOpen, onExitComplete]);

  const requestClose = useCallback((close: () => void) => {
    if (closeTimer.current) return;
    setIsVisible(false);
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      setIsMounted(false);
      close();
    }, exitDuration);
  }, [exitDuration]);

  return { isMounted, isVisible, requestClose, enterDuration, exitDuration };
}
