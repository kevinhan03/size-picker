import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { ClosetSizeSelection, Product } from "../types";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
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

  useBodyScrollLock(sheetRef);

  useEffect(() => {
    setSelectedRowIndex(safeInitialIndex);
    setManualSize("");
  }, [safeInitialIndex, product.id]);

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

  const canConfirm = selectedRowIndex !== null || manualSize.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={sheetRef}
        className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-3xl border border-white/10 bg-[#111114] p-5 text-white shadow-[0_-24px_60px_rgba(0,0,0,0.55)] sm:rounded-3xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-orange-400">{product.brand}</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-white">{product.name}</p>
            <h3 className="mt-1 truncate text-lg font-black">옷장에 추가</h3>
            <p className="mt-1 text-sm text-gray-400">보유한 사이즈를 선택하세요.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="사이즈 선택 닫기"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-gray-400 transition hover:bg-white/[0.1] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {rows.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {rows.map((row, index) => {
              const label = String(row[0] ?? "").trim() || `Size ${index + 1}`;
              const active = selectedRowIndex === index;
              return (
                <button
                  key={`${label}-${index}`}
                  type="button"
                  onClick={() => {
                    setSelectedRowIndex(index);
                    setManualSize("");
                  }}
                  className={`h-11 rounded-xl border text-sm font-black transition ${
                    active
                      ? "border-orange-500 bg-orange-500 text-black shadow-[0_0_18px_rgba(249,115,22,0.35)]"
                      : "border-white/10 bg-white/[0.06] text-gray-200 hover:border-orange-500/50 hover:text-orange-300"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-gray-400">
            이 상품은 사이즈표가 없어 직접 입력으로 저장할 수 있습니다.
          </div>
        )}

        <div className="mt-4">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">직접 입력</label>
          <input
            value={manualSize}
            onChange={(event) => {
              setManualSize(event.target.value);
              setSelectedRowIndex(null);
            }}
            placeholder="예: M, 2, 260"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold text-white outline-none transition placeholder:text-gray-600 focus:border-orange-500/70"
          />
        </div>

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
            className="h-12 rounded-xl bg-orange-500 px-5 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
          >
            선택
          </button>
        </div>
      </div>
    </div>
  );
}
