"use client";

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
  if (!presence.isMounted) return null;

  const close = () => presence.requestClose(onClose);

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="이미지 확대 닫기"
        onClick={close}
        className="ui-layer-scrim absolute inset-0 cursor-zoom-out bg-black/90 backdrop-blur-sm"
        data-visible={presence.isVisible}
      />
      <div className="ui-layer-modal relative z-10 flex h-[63vh] w-full max-w-6xl items-center justify-center" data-visible={presence.isVisible}>
        <img src={src} alt={alt} className="max-h-full max-w-full object-contain" style={{ borderRadius: "20px" }} />
      </div>
    </div>
  );
}
