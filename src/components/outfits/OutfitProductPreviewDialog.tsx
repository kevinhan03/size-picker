"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Product } from "../../types";
import { usePresence } from "../../hooks/usePresence";
import { OutfitImageFrame } from "./OutfitImageFrame";

function trapDialogFocus(event: React.KeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return;
  const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])"));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

export function OutfitProductPreviewDialog({
  product,
  onClose,
  selected = false,
  selectionDisabled = false,
  onToggle,
  selectLabel = "코디에 담기",
  selectedLabel = "코디에 담김",
}: {
  product: Product;
  onClose: () => void;
  selected?: boolean;
  selectionDisabled?: boolean;
  onToggle?: () => void;
  selectLabel?: string;
  selectedLabel?: string;
}) {
  const presence = usePresence(true);
  const dialogRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const close = () => presence.requestClose(onClose);

  useEffect(() => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    requestAnimationFrame(() => dialogRef.current?.focus());
    return () => restoreFocusRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <button type="button" aria-label="상품 이미지 닫기" onClick={close} className="ui-layer-scrim absolute inset-0 cursor-default bg-black/80 backdrop-blur-sm" data-visible={presence.isVisible} />
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-label={`${product.brand} ${product.name} 이미지 크게 보기`} tabIndex={-1} onKeyDown={(event) => { trapDialogFocus(event); if (event.key === "Escape") close(); }} className="ui-layer-modal ui-floating-surface relative z-10 h-[min(44rem,calc(100dvh-2rem))] w-full max-w-4xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#17171a] shadow-[0_24px_64px_rgba(0,0,0,0.68)] outline-none" data-visible={presence.isVisible}>
        <button type="button" onClick={close} aria-label="상품 이미지 닫기" className="outfit-detail-pressable absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"><X className="h-5 w-5" /></button>
        <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]">
          <div className="relative min-h-0 bg-black/25 p-6 sm:p-8 md:p-10">
            <OutfitImageFrame product={product} alt={`${product.brand} ${product.name}`} fit="contain" />
          </div>
          <div className="flex min-h-0 flex-col border-t border-white/10 bg-[#17171a] p-5 sm:p-6 md:flex-row md:items-center md:gap-6 md:px-7">
            <div className="min-w-0 pr-11 md:flex-1 md:pr-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/55">{product.brand}</p>
              <h2 className="mt-1 text-lg font-bold leading-6 tracking-[-0.015em] text-white">{product.name}</h2>
              <p className="mt-2 text-sm text-white/55">{product.category}</p>
            </div>
            {onToggle && (
              <div className="mt-5 border-t border-white/10 pt-5 md:mt-0 md:w-52 md:shrink-0 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                <p className={`min-h-5 whitespace-nowrap text-sm font-semibold ${selectionDisabled ? "text-orange-300" : "text-white/75"}`}>{selected ? selectedLabel : selectionDisabled ? "최대 선택 개수예요." : "\u00a0"}</p>
                <button type="button" disabled={selectionDisabled} onClick={onToggle} className={`outfit-detail-pressable mt-3 min-h-11 w-full rounded-xl px-4 text-sm transition-[background-color,border-color,color,transform] duration-150 disabled:cursor-not-allowed disabled:opacity-35 ${selected ? "border border-white/15 bg-white/[0.06] font-bold text-white" : "bg-orange-500 font-black text-black"}`}>{selected ? "선택 해제" : selectLabel}</button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
