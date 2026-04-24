"use client";

import { type RefObject, useEffect } from "react";

const SCROLL_KEYS = new Set(["ArrowDown", "ArrowUp", "End", "Home", "PageDown", "PageUp", " "]);

function shouldPreventScroll(container: HTMLElement, deltaY: number) {
  if (deltaY === 0) return false;

  const atTop = container.scrollTop <= 0;
  const atBottom = Math.ceil(container.scrollTop + container.clientHeight) >= container.scrollHeight;

  return (deltaY < 0 && atTop) || (deltaY > 0 && atBottom);
}

export function useBodyScrollLock(modalRef: RefObject<HTMLElement | null>, isLocked = true) {
  useEffect(() => {
    if (!isLocked) return;

    let lastTouchY: number | null = null;

    const isOutsideModal = (target: EventTarget | null) => {
      const modal = modalRef.current;
      return !modal || !(target instanceof Node) || !modal.contains(target);
    };

    const preventIfOutsideOrChaining = (event: WheelEvent | TouchEvent, deltaY: number) => {
      const modal = modalRef.current;
      if (!modal || isOutsideModal(event.target) || shouldPreventScroll(modal, deltaY)) {
        event.preventDefault();
      }
    };

    const handleWheel = (event: WheelEvent) => {
      preventIfOutsideOrChaining(event, event.deltaY);
    };

    const handleTouchStart = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const currentY = event.touches[0]?.clientY ?? null;
      if (lastTouchY === null || currentY === null) {
        preventIfOutsideOrChaining(event, 0);
        return;
      }

      preventIfOutsideOrChaining(event, lastTouchY - currentY);
      lastTouchY = currentY;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!SCROLL_KEYS.has(event.key) || !isOutsideModal(document.activeElement)) return;
      event.preventDefault();
    };

    document.addEventListener("wheel", handleWheel, { capture: true, passive: false });
    document.addEventListener("touchstart", handleTouchStart, { capture: true, passive: false });
    document.addEventListener("touchmove", handleTouchMove, { capture: true, passive: false });
    document.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener("wheel", handleWheel, { capture: true });
      document.removeEventListener("touchstart", handleTouchStart, { capture: true });
      document.removeEventListener("touchmove", handleTouchMove, { capture: true });
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [isLocked, modalRef]);
}
