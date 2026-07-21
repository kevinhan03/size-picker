import { type PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { ClosetSizeSelection, Product } from "../types";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { usePresence } from "../hooks/usePresence";
import { OnboardingTutorial, type TutorialAnchorRect, type TutorialId } from "./OnboardingTutorial";
import {
  getDisplaySizeTable,
  normalizeMeasurementLabel,
  normalizeMeasurementValueForDisplay,
} from "../utils/sizeTable";

export function buildClosetSizeSelection(
  product: Product,
  rowIndex: number | null,
  manualSize: string
): ClosetSizeSelection | null {
  const sizeTable = getDisplaySizeTable(product);
  const manualLabel = manualSize.trim();
  if (rowIndex === null || !sizeTable?.rows?.[rowIndex]) {
    return manualLabel ? { label: manualLabel, rowIndex: null, snapshot: null } : null;
  }
  const row = sizeTable.rows[rowIndex].map((cell) => String(cell ?? "").trim());
  const headers = sizeTable.headers.map((header) => String(header ?? "").trim());
  const label = String(row[0] || manualLabel || "").trim();
  return {
    label: label || null,
    rowIndex,
    snapshot: label ? { headers, row } : null,
  };
}

export function SizeSelectionSheet({
  product,
  initialRowIndex,
  onClose,
  onConfirm,
}: {
  product: Product;
  initialRowIndex: number | null;
  onClose: () => void;
  onConfirm: (selection: ClosetSizeSelection | null) => void;
}) {
  const sizeTable = useMemo(() => getDisplaySizeTable(product), [product]);
  const rows = useMemo(() => sizeTable?.rows ?? [], [sizeTable]);
  const headers = useMemo(() => sizeTable?.headers ?? [], [sizeTable]);
  const safeInitialIndex = initialRowIndex !== null && rows[initialRowIndex] ? initialRowIndex : null;
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(safeInitialIndex);
  const [manualSize, setManualSize] = useState("");
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const { isVisible, requestClose } = usePresence(true);
  const dragStartRef = useRef<{ id: number; y: number; samples: Array<{ y: number; at: number }> } | null>(null);
  const springFrameRef = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [activeTutorial, setActiveTutorial] = useState<{ id: TutorialId; anchorRect?: TutorialAnchorRect } | null>(null);
  const [isPortalReady, setIsPortalReady] = useState(false);

  useBodyScrollLock(sheetRef);

  const closeSheet = useCallback(() => {
    if (springFrameRef.current) cancelAnimationFrame(springFrameRef.current);
    requestClose(onClose);
  }, [onClose, requestClose]);

  const springTo = useCallback((target: number, initialVelocity: number, onComplete?: () => void) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDragOffset(target);
      onComplete?.();
      return;
    }
    if (springFrameRef.current) cancelAnimationFrame(springFrameRef.current);
    let position = dragOffset;
    let velocity = initialVelocity;
    let previousTime = performance.now();
    const step = (now: number) => {
      const elapsed = Math.min((now - previousTime) / 1000, 0.032);
      previousTime = now;
      velocity += (360 * (target - position) - 34 * velocity) * elapsed;
      position += velocity * elapsed;
      setDragOffset(position);
      if (Math.abs(target - position) < 0.6 && Math.abs(velocity) < 4) {
        setDragOffset(target);
        springFrameRef.current = null;
        onComplete?.();
        return;
      }
      springFrameRef.current = requestAnimationFrame(step);
    };
    springFrameRef.current = requestAnimationFrame(step);
  }, [dragOffset]);

  const onDragStart = (event: PointerEvent<HTMLDivElement>) => {
    if (springFrameRef.current) cancelAnimationFrame(springFrameRef.current);
    const now = performance.now();
    dragStartRef.current = { id: event.pointerId, y: event.clientY, samples: [{ y: event.clientY, at: now }] };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDragMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start || start.id !== event.pointerId) return;
    const distance = event.clientY - start.y;
    const now = performance.now();
    start.samples = [...start.samples, { y: event.clientY, at: now }].slice(-4);
    if (Math.abs(distance) < 10) return;
    const upwardResistance = distance < 0
      ? (distance * 92) / (Math.abs(distance) + 92)
      : distance;
    setDragOffset(upwardResistance);
  };

  const onDragEnd = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start || start.id !== event.pointerId) return;
    dragStartRef.current = null;
    const distance = event.clientY - start.y;
    const samples = start.samples;
    const first = samples[0];
    const last = samples[samples.length - 1];
    const velocity = (last.y - first.y) / Math.max(last.at - first.at, 1);
    if (distance > 120 || (velocity > 0.11 && distance > 10)) {
      springTo(window.innerHeight, velocity * 1000, closeSheet);
      return;
    }
    springTo(0, velocity * 1000);
  };

  useEffect(() => () => {
    if (springFrameRef.current) cancelAnimationFrame(springFrameRef.current);
  }, []);

  useEffect(() => {
    setIsPortalReady(true);
  }, []);

  useEffect(() => {
    setSelectedRowIndex(safeInitialIndex);
    setManualSize("");
  }, [safeInitialIndex, product.id]);

  useEffect(() => {
    if (!isPortalReady) return;
    const storageKey = "sizepicker:tutorial:v2:sizeSelection";
    if (window.localStorage.getItem(storageKey)) return;
    window.localStorage.setItem(storageKey, "true");
    const rect = sheetRef.current?.getBoundingClientRect();
    setActiveTutorial({
      id: "sizeSelection",
      anchorRect: rect
        ? {
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }
        : undefined,
    });
  }, [isPortalReady]);

  const selectedRow = useMemo(
    () => (selectedRowIndex !== null ? rows[selectedRowIndex] : null),
    [rows, selectedRowIndex]
  );
  const measurements = useMemo(() => {
    if (!selectedRow) return [];
    return headers
      .slice(1)
      .map((header, index) => ({
        label: normalizeMeasurementLabel(header) || String(header ?? "").trim(),
        value: normalizeMeasurementValueForDisplay(selectedRow[index + 1]),
      }))
      .filter(({ label, value }) => label && value);
  }, [headers, selectedRow]);

  const hasSizeTable = rows.length > 0;
  const canConfirm = hasSizeTable ? selectedRowIndex !== null : manualSize.trim().length > 0;
  const selectedSizeLabel = selectedRow ? String(selectedRow[0] ?? '').trim() : manualSize.trim();
  const measurementSummary = measurements
    .map(({ label, value }) => `${label} ${value}`)
    .join(' · ');
  const selectionHint = hasSizeTable
    ? '사이즈를 선택하면 주요 치수를 확인할 수 있어요.'
    : '입력한 사이즈는 내 옷장에 함께 저장됩니다.';
  const confirmLabel = canConfirm
    ? `${selectedSizeLabel} 선택 완료`
    : hasSizeTable
      ? '사이즈를 선택하세요'
      : '사이즈를 입력하세요';

  return isPortalReady ? createPortal(
    (
    <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center">
      <div className="ui-layer-scrim absolute inset-0 bg-black/70 backdrop-blur-sm" data-visible={isVisible} onClick={closeSheet} />
      <div
        ref={sheetRef}
        className="ui-layer-sheet relative max-h-[90dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-3xl bg-[#111114] p-5 text-white shadow-[0_-24px_60px_rgba(0,0,0,0.55)] sm:rounded-3xl sm:p-6"
        data-visible={isVisible}
        style={dragOffset ? { transform: `translateY(${dragOffset}px)`, transition: "none" } : undefined}
      >
        <div
          className="-mx-2 -mt-3 mb-2 flex h-7 touch-none items-center justify-center sm:hidden"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          aria-label="사이즈 선택 시트 닫기"
        >
          <span className="h-1 w-10 rounded-full bg-white/25" />
        </div>
        <div className="sticky top-0 z-10 -mx-5 mb-5 bg-[#111114] px-5 py-3 sm:-mx-6 sm:px-6">
          <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold">보유 사이즈 선택</h3>
            {product.brand ? <p className="mt-1 truncate text-xs font-semibold tracking-wide text-white/40">{product.brand}</p> : null}
            <p className="mt-0.5 truncate text-sm font-semibold text-white/85">{product.name}</p>
          </div>
          <button
            type="button"
            onClick={closeSheet}
            aria-label="사이즈 선택 닫기"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-gray-400 transition hover:bg-white/[0.1] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          </div>
        </div>

        {hasSizeTable ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {rows.map((row, index) => {
                const label = String(row[0] ?? "").trim() || `Size ${index + 1}`;
                const active = selectedRowIndex === index;
                return (
                  <button
                    key={`${label}-${index}`}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedRowIndex(index)}
                    className={`relative h-12 rounded-xl border text-sm font-bold transition-[background-color,border-color,color,box-shadow] ${
                      active
                        ? "border-white/35 bg-white/[0.12] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                        : "border-white/10 bg-white/[0.06] text-gray-200 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-bold text-white">사이즈표가 없는 상품입니다</p>
            <p className="mt-1 text-sm text-gray-400">보유 사이즈를 직접 입력해주세요.</p>
            <label className="mb-2 mt-4 block text-xs font-bold uppercase tracking-wide text-gray-500">보유 사이즈</label>
            <input
              value={manualSize}
              onChange={(event) => setManualSize(event.target.value)}
              placeholder="예: M, 32, 260, Free"
              autoFocus
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500/70"
            />
          </div>
        )}

        <div className="mt-4 min-h-6" aria-live="polite">
          {canConfirm ? (
            <p className="text-sm leading-6 text-white/55">
              <span className="font-bold text-white">{selectedSizeLabel}</span>
              <span>{measurementSummary ? ` · ${measurementSummary}` : ` · ${hasSizeTable ? '선택한 사이즈로 내 옷장에 저장됩니다.' : '직접 입력한 보유 사이즈입니다.'}`}</span>
            </p>
          ) : <p className="text-xs text-gray-500">{selectionHint}</p>}
        </div>

        <div className="sticky bottom-0 -mx-5 mt-3 grid grid-cols-2 gap-2 bg-[#111114] px-5 pb-[calc(0.25rem+env(safe-area-inset-bottom))] pt-4 sm:-mx-6 sm:px-6">
          <button
            type="button"
            onClick={() => onConfirm(null)}
            className="h-12 rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-bold text-gray-300 transition hover:bg-white/[0.09] hover:text-white"
          >
            사이즈 없이 저장
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(buildClosetSizeSelection(product, selectedRowIndex, manualSize))}
            className="h-12 rounded-xl bg-orange-500 px-5 text-sm font-bold text-black transition-[background-color,color] hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      {activeTutorial && (
        <OnboardingTutorial
          tutorialId={activeTutorial.id}
          anchorRect={activeTutorial.anchorRect}
          onClose={() => setActiveTutorial(null)}
        />
      )}
    </div>
    ),
    document.body
  ) : null;
}
