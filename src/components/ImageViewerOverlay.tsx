"use client";

import { useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { usePresence } from "../hooks/usePresence";

interface ImageViewerOverlayProps {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
}

/** Shared image layer with an interruptible exit transition. */
export function ImageViewerOverlay({ open, src, alt, onClose }: ImageViewerOverlayProps) {
  const presence = usePresence(open);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    wasOpenRef.current = open;
  }, [open]);

  const close = useCallback(() => {
    presence.requestClose(() => {
      onClose();
      requestAnimationFrame(() => triggerRef.current?.focus());
    });
  }, [onClose, presence]);

  useEffect(() => {
    if (!presence.isVisible) return;
    closeButtonRef.current?.focus();
  }, [presence.isVisible]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close, open]);

  if (!presence.isMounted) return null;

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} 확대 보기`}
    >
      <button
        type="button"
        aria-label="확대 이미지 닫기"
        onClick={close}
        className="ui-layer-scrim absolute inset-0 cursor-zoom-out bg-black/90 backdrop-blur-sm"
        data-visible={presence.isVisible}
      />
      <div className="ui-layer-modal relative z-10 flex h-[63vh] w-full max-w-6xl items-center justify-center" data-visible={presence.isVisible}>
        <button
          type="button"
          aria-label="확대 이미지 닫기"
          onClick={close}
          className="flex h-full w-full cursor-zoom-out items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Preserve the overlay's native full-resolution loading behavior. */}
          <img src={src} alt={alt} className="max-h-full max-w-full object-contain" style={{ borderRadius: "20px" }} />
        </button>
      </div>
      <button
        ref={closeButtonRef}
        type="button"
        aria-label="확대 이미지 닫기"
        onClick={close}
        className="ui-layer-modal absolute right-5 top-5 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white shadow-lg transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        data-visible={presence.isVisible}
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
