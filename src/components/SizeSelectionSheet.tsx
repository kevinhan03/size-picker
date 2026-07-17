import { type PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const dragStartRef = useRef<{ id: number; y: number; startedAt: number } | null>(null);
  const springFrameRef = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [activeTutorial, setActiveTutorial] = useState<{ id: TutorialId; anchorRect?: TutorialAnchorRect } | null>(null);

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
    dragStartRef.current = { id: event.pointerId, y: event.clientY, startedAt: performance.now() };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDragMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start || start.id !== event.pointerId) return;
    const distance = event.clientY - start.y;
    if (Math.abs(distance) < 10) return;
    setDragOffset(distance < 0 ? distance * 0.18 : distance);
  };

  const onDragEnd = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start || start.id !== event.pointerId) return;
    dragStartRef.current = null;
    const distance = event.clientY - start.y;
    const velocity = distance / Math.max(performance.now() - start.startedAt, 1);
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
    setSelectedRowIndex(safeInitialIndex);
    setManualSize("");
  }, [safeInitialIndex, product.id]);

  useEffect(() => {
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
  }, []);

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

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center">
      <div className="ui-layer-scrim absolute inset-0 bg-black/70 backdrop-blur-sm" data-visible={isVisible} onClick={closeSheet} />
      <div
        ref={sheetRef}
        className="ui-layer-sheet ui-floating-surface relative max-h-[90dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-3xl border border-white/10 bg-[#111114] p-5 text-white shadow-[0_-24px_60px_rgba(0,0,0,0.55)] sm:rounded-3xl sm:p-6"
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
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold">보유 사이즈 선택</h3>
            <p className="mt-1 truncate text-sm text-gray-400">{product.name}</p>
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

        {hasSizeTable ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {rows.map((row, index) => {
                const label = String(row[0] ?? "").trim() || `Size ${index + 1}`;
                const active = selectedRowIndex === index;
                return (
                  <button
                    key={`${label}-${index}`}
                    type="button"
                    onClick={() => setSelectedRowIndex(index)}
                    className={`h-12 rounded-xl border text-sm font-bold transition-[background-color,border-color,color,box-shadow] ${
                      active
                        ? "border-orange-400/75 bg-orange-500/[0.16] text-orange-100 shadow-[inset_0_0_0_1px_rgba(251,146,60,0.12)]"
                        : "border-white/10 bg-white/[0.06] text-gray-200 hover:border-orange-400/50 hover:text-orange-200"
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

        {measurements.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            {measurements.map(({ label, value }) => (
              <span key={`${label}-${value}`} className="rounded-lg bg-white/[0.08] px-2 py-1 text-xs font-semibold text-gray-300">
                {label} {value}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onConfirm(null)}
            className="h-12 rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-bold text-gray-300 transition hover:bg-white/[0.09] hover:text-white"
          >
            사이즈 선택 안함
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(buildClosetSizeSelection(product, selectedRowIndex, manualSize))}
            className="h-12 rounded-xl bg-orange-500 px-5 text-sm font-bold text-black transition-[background-color,color] hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
          >
            선택
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
  );
}
