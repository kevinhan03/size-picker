"use client";

import { type RefObject, useEffect } from "react";

const SCROLL_KEYS = new Set(["ArrowDown", "ArrowUp", "End", "Home", "PageDown", "PageUp", " "]);

function shouldPreventScroll(container: HTMLElement, deltaY: number) {
  if (deltaY === 0) return false;
  const atTop = container.scrollTop <= 0;
  const atBottom = Math.ceil(container.scrollTop + container.clientHeight) >= container.scrollHeight;
  return (deltaY < 0 && atTop) || (deltaY > 0 && atBottom);
}

// 터치 시작 위치에서 가장 가까운 수직 스크롤 가능 조상을 찾는다 (boundary까지만).
function findScrollableAncestor(target: EventTarget | null, boundary: HTMLElement): HTMLElement {
  let el = target instanceof Element ? (target as HTMLElement) : null;
  while (el && el !== boundary.parentElement) {
    if (el === boundary) return boundary;
    const { overflowY } = window.getComputedStyle(el);
    if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight) {
      return el;
    }
    el = el.parentElement;
  }
  return boundary;
}

// 터치 시작 위치에서 가로 스크롤 가능한 조상이 있는지 확인한다.
// touch-action: manipulation으로 양방향을 허용하더라도, 실제로 가로 스크롤 중인
// 요소 위에서의 세로 이동이 body까지 전파되지 않도록 한다.
function hasHorizontalScrollableAncestor(target: EventTarget | null, boundary: HTMLElement): boolean {
  let el = target instanceof Element ? (target as HTMLElement) : null;
  while (el && el !== boundary.parentElement) {
    if (el === boundary) break;
    const { overflowX } = window.getComputedStyle(el);
    if ((overflowX === "auto" || overflowX === "scroll") && el.scrollWidth > el.clientWidth) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

export function useBodyScrollLock(modalRef: RefObject<HTMLElement | null>, isLocked = true) {
  useEffect(() => {
    if (!isLocked) return;

    let lastTouchY: number | null = null;
    let lastTouchX: number | null = null;
    let touchTarget: EventTarget | null = null;
    // 이 터치가 가로 스크롤 요소 위에서 시작됐는지 기록
    let touchStartedOnHScrollable = false;

    const isOutsideModal = (target: EventTarget | null) => {
      const modal = modalRef.current;
      return !modal || !(target instanceof Node) || !modal.contains(target);
    };

    const preventIfOutsideOrChaining = (event: TouchEvent | WheelEvent, deltaY: number, deltaX = 0) => {
      const modal = modalRef.current;
      if (!modal || isOutsideModal(event.target)) {
        event.preventDefault();
        return;
      }

      // 가로 스크롤 요소 위에서 시작된 터치가 수평 방향이면 가로 스크롤에 맡긴다.
      if (touchStartedOnHScrollable && Math.abs(deltaX) >= Math.abs(deltaY)) return;

      // 터치가 시작된 위치의 실제 수직 스크롤 조상을 찾아 경계 체크
      const scrollable = findScrollableAncestor(touchTarget ?? event.target, modal);
      if (shouldPreventScroll(scrollable, deltaY)) {
        event.preventDefault();
      }
    };

    const handleWheel = (event: WheelEvent) => {
      preventIfOutsideOrChaining(event, event.deltaY, event.deltaX);
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      lastTouchY = touch?.clientY ?? null;
      lastTouchX = touch?.clientX ?? null;
      touchTarget = event.target;
      const modal = modalRef.current;
      touchStartedOnHScrollable = modal
        ? hasHorizontalScrollableAncestor(event.target, modal)
        : false;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      const currentY = touch?.clientY ?? null;
      const currentX = touch?.clientX ?? null;
      if (lastTouchY === null || currentY === null) {
        preventIfOutsideOrChaining(event, 0);
        return;
      }
      const deltaY = lastTouchY - currentY;
      const deltaX = lastTouchX !== null && currentX !== null ? lastTouchX - currentX : 0;
      preventIfOutsideOrChaining(event, deltaY, deltaX);
      lastTouchY = currentY;
      lastTouchX = currentX;
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
