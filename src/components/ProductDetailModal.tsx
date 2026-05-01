import { useEffect, useMemo, useState } from "react";
import type { RefObject, SyntheticEvent } from "react";
import { ChevronDown, ExternalLink, X } from "lucide-react";
import { ProgressiveImage } from "./ProgressiveImage";
import type { ClosetSizeSelection, MySizeProfile, Product, SizeRecommendation } from "../types";
import { DEFAULT_PRODUCT_PLACEHOLDER } from "../constants";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { useMySizesContext } from "../contexts/MySizesContext";
import {
  compareMeasurementSnapshots,
  displayTableCell,
  getDisplaySizeTable,
  isPrimaryColumnHeader,
  normalizeMeasurementLabel,
  normalizeMeasurementValueForDisplay,
} from "../utils/sizeTable";

function HangerIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 7.25c0-1.45 1.05-2.5 2.45-2.5 1.25 0 2.3.92 2.3 2.15 0 1.1-.6 1.75-1.85 2.45L12 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 11 4.9 16.25c-.9.67-.42 2.1.7 2.1h12.8c1.12 0 1.6-1.43.7-2.1L12 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClosetIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 4.75h12c.69 0 1.25.56 1.25 1.25v13.25H4.75V6c0-.69.56-1.25 1.25-1.25Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 4.75v14.5M8.75 12h.01M15.25 12h.01M7 19.25v1M17 19.25v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ProductDetailModalProps {
  product: Product;
  closetProduct?: Product | null;
  activeRowIndex: number | null;
  onClose: () => void;
  onRowClick: (rowIndex: number) => void;
  recommendations: SizeRecommendation[];
  onRecommendationClick: (product: Product) => void;
  onZoomImage: () => void;
  onImageError: (event: SyntheticEvent<HTMLImageElement>) => void;
  modalRef: RefObject<HTMLDivElement | null>;
  recommendationsRef: RefObject<HTMLDivElement | null>;
  smoothScrollTo: (container: HTMLElement, targetY: number, duration?: number) => void;
  onToggleCloset?: (selection?: ClosetSizeSelection | null) => void;
  isInCloset?: boolean;
  onToggleDigbox?: () => void;
  isInDigbox?: boolean;
  hideDigboxButton?: boolean;
  hideCollectionActions?: boolean;
}

function getClosetSizeLabel(product?: Product | null): string {
  return String(product?.closetSelectedSizeLabel || "").trim();
}

function getClosetSizeRowIndex(product?: Product | null): number | null {
  return Number.isInteger(product?.closetSelectedSizeRowIndex) ? product!.closetSelectedSizeRowIndex! : null;
}

function SavedSizeSummary({ product }: { product?: Product | null }) {
  const label = getClosetSizeLabel(product);
  if (!label) return null;

  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-black text-gray-300">
      <span className="uppercase text-gray-500">My size</span>
      <span className="text-sm leading-none text-orange-400">{label}</span>
    </span>
  );
}

function buildClosetSizeSelection(
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

function SizeSelectionSheet({
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
  const sizeTable = getDisplaySizeTable(product);
  const rows = sizeTable?.rows ?? [];
  const headers = sizeTable?.headers ?? [];
  const safeInitialIndex = initialRowIndex !== null && rows[initialRowIndex] ? initialRowIndex : null;
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(safeInitialIndex);
  const [manualSize, setManualSize] = useState("");

  useEffect(() => {
    setSelectedRowIndex(safeInitialIndex);
    setManualSize("");
  }, [safeInitialIndex, product.id]);

  const selectedRow = selectedRowIndex !== null ? rows[selectedRowIndex] : null;
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
      <div className="relative w-full max-w-lg rounded-t-3xl border border-white/10 bg-[#111114] p-5 text-white shadow-[0_-24px_60px_rgba(0,0,0,0.55)] sm:rounded-3xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-orange-400">{product.brand}</p>
            <h3 className="mt-1 truncate text-lg font-black">내 옷장에 추가</h3>
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

        <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
          <button
            type="button"
            onClick={() => onConfirm(null)}
            className="h-12 rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-bold text-gray-300 transition hover:bg-white/[0.09] hover:text-white"
          >
            사이즈 없이 추가
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(buildClosetSizeSelection(product, selectedRowIndex, manualSize))}
            className="h-12 rounded-xl bg-orange-500 px-5 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductDetailModal({
  product,
  closetProduct,
  activeRowIndex,
  onClose,
  onRowClick,
  recommendations,
  onRecommendationClick,
  onZoomImage,
  onImageError,
  modalRef,
  recommendationsRef,
  smoothScrollTo,
  onToggleCloset,
  isInCloset,
  onToggleDigbox,
  isInDigbox,
  hideDigboxButton,
  hideCollectionActions,
}: ProductDetailModalProps) {
  useBodyScrollLock(modalRef);
  const [isSizeSheetOpen, setIsSizeSheetOpen] = useState(false);
  const [isExtraMeasurementsOpen, setIsExtraMeasurementsOpen] = useState(false);
  const [isMySizeDetailsOpen, setIsMySizeDetailsOpen] = useState(false);
  const [isMySizePickerOpen, setIsMySizePickerOpen] = useState(false);
  const [mySizeSearchQuery, setMySizeSearchQuery] = useState("");
  const [isSimilarProductsOpen, setIsSimilarProductsOpen] = useState(false);
  const { mySizes } = useMySizesContext();
  const [selectedMySizeId, setSelectedMySizeId] = useState<string>("");
  const savedClosetProduct = closetProduct || null;
  const savedSizeLabel = getClosetSizeLabel(savedClosetProduct);
  const savedSizeRowIndex = getClosetSizeRowIndex(savedClosetProduct);
  const displaySizeTable = useMemo(() => getDisplaySizeTable(product), [product]);
  const displayProduct = useMemo(
    () => ({ ...product, sizeTable: displaySizeTable }),
    [displaySizeTable, product]
  );
  const categoryMySizes = useMemo(
    () => mySizes.filter((profile) => profile.category === product.category),
    [mySizes, product.category]
  );
  const selectedMySize = useMemo(() => {
    if (!categoryMySizes.length) return null;
    return categoryMySizes.find((profile) => profile.id === selectedMySizeId) || categoryMySizes[0];
  }, [categoryMySizes, selectedMySizeId]);
  const filteredMySizes = useMemo(() => {
    const query = mySizeSearchQuery.trim().toLowerCase();
    if (!query) return categoryMySizes;
    return categoryMySizes.filter((profile) =>
      `${profile.title} ${profile.sizeLabel || ""} ${profile.fitNote || ""}`.toLowerCase().includes(query)
    );
  }, [categoryMySizes, mySizeSearchQuery]);
  const activeProductSnapshot = useMemo(() => {
    if (activeRowIndex === null || !displaySizeTable?.rows?.[activeRowIndex]) return null;
    return {
      headers: displaySizeTable.headers,
      row: displaySizeTable.rows[activeRowIndex],
    };
  }, [activeRowIndex, displaySizeTable]);
  const mySizeComparisons = useMemo(
    () => compareMeasurementSnapshots(activeProductSnapshot, selectedMySize?.measurementSnapshot),
    [activeProductSnapshot, selectedMySize]
  );
  const isSelectedMySizeSourceProduct = selectedMySize?.sourceProductId === product.id;

  useEffect(() => {
    setIsExtraMeasurementsOpen(false);
    setIsMySizeDetailsOpen(false);
    setIsMySizePickerOpen(false);
    setMySizeSearchQuery("");
    setIsSimilarProductsOpen(false);
  }, [product.id]);

  useEffect(() => {
    setSelectedMySizeId(categoryMySizes[0]?.id || "");
    setIsMySizePickerOpen(false);
    setMySizeSearchQuery("");
  }, [categoryMySizes]);

  const handleRowClick = (rowIndex: number) => {
    onRowClick(rowIndex);
    setIsSimilarProductsOpen(false);
    setTimeout(() => {
      const modal = modalRef.current;
      const target = recommendationsRef.current;
      if (!modal || !target) return;
      const modalRect = modal.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const targetY = modal.scrollTop + (targetRect.top - modalRect.top) - 16;
      smoothScrollTo(modal, targetY);
    }, 50);
  };

  const handleClosetClick = () => {
    if (!onToggleCloset) return;
    if (isInCloset) {
      onToggleCloset(null);
      return;
    }
    setIsSizeSheetOpen(true);
  };

  const handleConfirmClosetSize = (selection: ClosetSizeSelection | null) => {
    setIsSizeSheetOpen(false);
    onToggleCloset?.(selection);
  };

  return (
    <>
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="ui-product-detail-modal relative flex flex-col max-h-[90vh] w-full max-w-4xl rounded-3xl bg-[#1c1c1f] shadow-[0_24px_60px_rgba(0,0,0,0.38)] md:h-[80.4vh] md:max-h-none md:w-[91%] md:max-w-[58.24rem]"
      >
        <div className="flex-shrink-0 z-10 flex items-center justify-between px-6 py-4 text-white bg-[#1c1c1f] border-b border-white/10 rounded-t-3xl">
          <h3 className="text-lg font-bold text-white sm:text-xl">상품 상세</h3>
          <div className="flex items-center gap-3">
            {!hideCollectionActions && !hideDigboxButton && (
            <div className="group relative">
              <button
                type="button"
                aria-label="DIGBOX에 추가"
                onClick={onToggleDigbox}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold backdrop-blur-xl transition ${
                  isInDigbox
                    ? "border-yellow-400/80 bg-[linear-gradient(180deg,rgba(250,204,21,0.45),rgba(250,204,21,0.28))] text-yellow-300 shadow-[0_4px_16px_rgba(250,204,21,0.35)]"
                    : "border-yellow-400/40 bg-[linear-gradient(180deg,rgba(250,204,21,0.22),rgba(250,204,21,0.09))] text-yellow-400 shadow-[0_4px_16px_rgba(250,204,21,0.15)] hover:border-yellow-400/70 hover:bg-[linear-gradient(180deg,rgba(250,204,21,0.32),rgba(250,204,21,0.15))] hover:text-yellow-300"
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill={isInDigbox ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
              <div className="pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#111114] px-2.5 py-1 text-xs font-semibold text-white opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all duration-150 ease-out scale-95 group-hover:opacity-100 group-hover:scale-100">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#111114]" />
                DIGBOX
              </div>
            </div>
            )}
            {!hideCollectionActions && !(hideDigboxButton && isInCloset) && (
            <div className="group relative">
              <button
                type="button"
                aria-label="내 옷장에 추가"
                onClick={handleClosetClick}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold backdrop-blur-xl transition ${
                  isInCloset
                    ? "border-orange-500/80 bg-[linear-gradient(180deg,rgba(249,115,22,0.45),rgba(249,115,22,0.28))] text-orange-300 shadow-[0_4px_16px_rgba(249,115,22,0.35)]"
                    : "border-orange-500/40 bg-[linear-gradient(180deg,rgba(249,115,22,0.22),rgba(249,115,22,0.09))] text-orange-400 shadow-[0_4px_16px_rgba(249,115,22,0.15)] hover:border-orange-500/70 hover:bg-[linear-gradient(180deg,rgba(249,115,22,0.32),rgba(249,115,22,0.15))] hover:text-orange-300"
                }`}
              >
                <ClosetIcon className="h-4 w-4" />
              </button>
              <div className="pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#111114] px-2.5 py-1 text-xs font-semibold text-white opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all duration-150 ease-out scale-95 group-hover:opacity-100 group-hover:scale-100">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#111114]" />
                옷장
              </div>
            </div>
            )}
            <button
              type="button"
              aria-label="상품 상세 닫기"
              onClick={onClose}
              className="flex items-center gap-2 rounded-lg border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.07))] px-3 py-1.5 text-xs font-bold text-gray-200 shadow-[0_4px_16px_rgba(0,0,0,0.2)] backdrop-blur-xl transition hover:border-orange-500/60 hover:text-orange-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={modalRef}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
        <div className="relative z-[1] p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <button
              type="button"
              onClick={onZoomImage}
              className="relative isolate h-[10.5rem] w-[10.5rem] cursor-zoom-in overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,rgba(30,38,54,0.42),rgba(8,11,18,0.18))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:h-[16.848rem] md:w-[16.848rem]"
            >
              <div className="pointer-events-none absolute inset-[-10%] rounded-[32px] bg-[radial-gradient(circle,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.06)_36%,rgba(255,255,255,0.02)_52%,transparent_74%)] opacity-80 blur-xl" />
              <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015)_40%,transparent_100%)]" />
              <div className="absolute inset-2 z-[1]">
                <ProgressiveImage
                  src={product.image}
                  thumbnailSrc={product.thumbnailImage}
                  alt={product.name}
                  className="object-contain"
                  loading="eager"
                  onError={onImageError}
                />
              </div>
            </button>
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-orange-500">
                <span className="rounded-md bg-orange-500/10 px-2 py-0.5 uppercase">{product.brand}</span>
                <span className="text-gray-500">{product.category}</span>
              </div>
              <h4 className="mb-2 text-2xl font-bold text-white">{product.name}</h4>
              {product.url ? (
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-gray-300 transition-colors hover:text-orange-400"
                >
                  공식 페이지 <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              ) : (
                <span className="text-sm text-gray-600">URL 없음</span>
              )}
              {savedClosetProduct ? (
                <div className="mt-3">
                  <SavedSizeSummary product={savedClosetProduct} />
                </div>
              ) : hideDigboxButton && isInCloset ? (
                <div className="mt-3">
                  <span className="inline-flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-300">
                    <ClosetIcon className="h-3.5 w-3.5" />
                    이미 옷장에 있어요
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {displaySizeTable?.headers?.length ? (
            <div className="mt-8 flex justify-start text-[11px] font-semibold text-gray-500">{"단위: cm"}</div>
          ) : null}
          <div className={`${displaySizeTable?.headers?.length ? "mt-1" : "mt-8"} relative overflow-x-auto rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.022)_28%,rgba(255,255,255,0.018)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]`}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018)_55%,transparent)]" />
            {displaySizeTable?.headers?.length ? (
              <table className="relative z-[1] min-w-full w-max text-center text-[11px] sm:text-sm">
                <thead className="text-[11px] sm:text-sm">
                  <tr>
                    {displaySizeTable.headers.map((header, index) => (
                      <th
                        key={index}
                        className={`whitespace-nowrap bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] px-2 py-2.5 text-xs font-bold uppercase sm:px-4 sm:py-3 sm:text-sm ${index === 0 ? "border-r border-white/[0.04]" : ""}`}
                        style={{ color: isPrimaryColumnHeader(header) ? "#E5E7EB" : "#00FF00" }}
                      >
                        {String(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displaySizeTable.rows.map((row, rowIndex) => {
                    const isActiveRow = activeRowIndex === rowIndex;
                    const isSavedRow = savedSizeRowIndex === rowIndex;
                    return (
                      <tr
                        key={rowIndex}
                        onClick={() => handleRowClick(rowIndex)}
                        className="group cursor-pointer transition-transform duration-200 active:scale-95"
                      >
                        {row.map((cell, cellIndex) => {
                          return (
                            <td
                              key={cellIndex}
                              className={`whitespace-nowrap px-2 py-2.5 text-[11px] font-medium transition-all duration-200 sm:px-4 sm:py-3 sm:text-sm ${cellIndex === 0 ? "border-r border-white/[0.04] text-xs font-bold sm:text-sm" : ""} ${
                                isActiveRow
                                  ? "bg-white text-black first:rounded-l-lg last:rounded-r-lg"
                                  : isSavedRow
                                  ? "bg-[#F97316]/40 text-orange-50 first:rounded-l-lg last:rounded-r-lg group-hover:bg-[#F97316]/50"
                                  : "bg-transparent text-gray-200 group-hover:bg-white/[0.92] group-hover:text-black group-hover:first:rounded-l-lg group-hover:last:rounded-r-lg"
                              }`}
                            >
                              {displayTableCell(cell)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-8 text-center text-gray-300">표시할 사이즈표 데이터가 없습니다.</div>
            )}
          </div>

          {categoryMySizes.length > 0 && (
            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-widest text-gray-400">내 기준 핏과 비교</h5>
                  <p className="mt-1 text-xs font-semibold text-gray-500">
                    {activeProductSnapshot?.row?.[0] ? `${activeProductSnapshot.row[0]}와 기준 핏 비교` : "비교할 상품 사이즈를 선택하세요"}
                  </p>
                </div>
              </div>

              {selectedMySize && (
                <div className="mt-3 rounded-xl border border-white/[0.06] bg-black/20 p-3">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-wide text-gray-600">기준 상품</p>
                      <div className="mt-1 flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-black text-white">{selectedMySize.title}</p>
                        {(selectedMySize.sizeLabel || selectedMySize.measurementSnapshot.row?.[0]) && (
                          <span className="shrink-0 rounded-md bg-orange-500/12 px-1.5 py-0.5 text-[10px] font-black text-orange-300">
                            {selectedMySize.sizeLabel || selectedMySize.measurementSnapshot.row?.[0]}
                          </span>
                        )}
                      </div>
                      {selectedMySize.fitNote && (
                        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-gray-500">
                          착용감 메모: {selectedMySize.fitNote}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMySizePickerOpen((value) => !value)}
                      aria-expanded={isMySizePickerOpen}
                      className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-black text-gray-300 transition hover:border-orange-500/40 hover:text-orange-300"
                    >
                      변경
                    </button>
                  </div>

                  {isMySizePickerOpen && (
                    <div className="mt-3 rounded-xl border border-white/[0.08] bg-[#111114] p-2">
                      <input
                        value={mySizeSearchQuery}
                        onChange={(event) => setMySizeSearchQuery(event.target.value)}
                        placeholder="상품명 또는 메모 검색"
                        className="mb-2 h-10 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 text-xs font-semibold text-white outline-none placeholder:text-gray-600 focus:border-orange-500/70"
                      />
                      <div className="grid max-h-[236px] gap-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {filteredMySizes.length > 0 ? (
                          filteredMySizes.map((profile) => {
                            const selected = selectedMySize?.id === profile.id;
                            const sizeLabel = String(profile.sizeLabel || profile.measurementSnapshot.row?.[0] || "").trim();
                            return (
                              <button
                                key={profile.id}
                                type="button"
                                onClick={() => {
                                  setSelectedMySizeId(profile.id);
                                  setIsMySizePickerOpen(false);
                                  setMySizeSearchQuery("");
                                }}
                                className={`flex min-w-0 items-center justify-between gap-3 rounded-lg border px-2.5 py-2 text-left transition ${
                                  selected
                                    ? "border-orange-500/60 bg-orange-500/12"
                                    : "border-transparent bg-transparent hover:border-white/[0.08] hover:bg-white/[0.045]"
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-bold text-white">{profile.title || "저장한 상품"}</p>
                                  <p className="mt-0.5 truncate text-[11px] font-semibold text-gray-600">{profile.fitNote || "메모 없음"}</p>
                                </div>
                                {sizeLabel && (
                                  <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black ${
                                    selected ? "bg-orange-500 text-black" : "bg-white/[0.08] text-gray-400"
                                  }`}>
                                    {sizeLabel}
                                  </span>
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="rounded-lg border border-white/[0.06] bg-white/[0.035] px-3 py-4 text-center text-xs font-semibold text-gray-500">
                            검색 결과가 없습니다.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isSelectedMySizeSourceProduct ? (
                <div className="mt-3 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm font-semibold text-orange-200">
                  이 상품은 선택한 기준 핏으로 등록된 상품입니다.
                </div>
              ) : activeRowIndex === null ? null : mySizeComparisons.length > 0 ? (
                <>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mySizeComparisons.slice(0, 6).map((item) => {
                      const diffText = `${item.diff > 0 ? "+" : ""}${item.diff.toFixed(1).replace(/\.0$/, "")}cm`;
                      const tone =
                        item.diff === 0
                          ? "border-white/10 bg-white/[0.06] text-gray-300"
                          : item.diff > 0
                          ? "border-orange-500/25 bg-orange-500/10 text-orange-300"
                          : "border-sky-400/25 bg-sky-400/10 text-sky-300";
                      return (
                        <span key={item.label} className={`rounded-xl border px-3 py-2 text-xs font-black ${tone}`}>
                          <span className="mr-1.5 text-gray-400">{item.label}</span>
                          {diffText}
                        </span>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMySizeDetailsOpen((value) => !value)}
                    className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-left text-xs font-bold text-gray-400 transition hover:border-white/[0.14] hover:text-white"
                  >
                    <span>상세 실측 보기</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isMySizeDetailsOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isMySizeDetailsOpen && (
                    <div className="mt-2 overflow-x-auto rounded-xl border border-white/[0.06] bg-black/20">
                      <table className="min-w-full text-left text-xs sm:text-sm">
                        <thead className="text-[11px] uppercase tracking-wide text-gray-500">
                          <tr>
                            <th className="px-3 py-2 font-black">항목</th>
                            <th className="px-3 py-2 font-black">상품</th>
                            <th className="px-3 py-2 font-black">내 기준</th>
                            <th className="px-3 py-2 font-black">차이</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mySizeComparisons.map((item) => (
                            <tr key={item.label} className="border-t border-white/[0.06]">
                              <td className="px-3 py-2 font-bold text-gray-200">{item.label}</td>
                              <td className="px-3 py-2 text-gray-300">{item.productValue.toFixed(1).replace(/\.0$/, "")}cm</td>
                              <td className="px-3 py-2 text-gray-300">{item.referenceValue.toFixed(1).replace(/\.0$/, "")}cm</td>
                              <td className={`px-3 py-2 font-black ${item.diff === 0 ? "text-gray-400" : item.diff > 0 ? "text-orange-300" : "text-sky-300"}`}>
                                {item.diff > 0 ? "+" : ""}{item.diff.toFixed(1).replace(/\.0$/, "")}cm
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-3 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-sm font-semibold text-gray-500">
                  비교 가능한 공통 실측이 없습니다.
                </div>
              )}
            </div>
          )}

          {displaySizeTable?.extra?.headers?.length ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              <button
                type="button"
                onClick={() => setIsExtraMeasurementsOpen((value) => !value)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                <span>추가 실측 정보</span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${isExtraMeasurementsOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isExtraMeasurementsOpen ? (
                <div className="overflow-x-auto border-t border-white/[0.06]">
                  <table className="min-w-full w-max text-center text-[11px] sm:text-sm">
                    <thead>
                      <tr>
                        {displaySizeTable.extra.headers.map((header, index) => (
                          <th
                            key={index}
                            className={`whitespace-nowrap bg-white/[0.04] px-2 py-2.5 text-xs font-bold uppercase sm:px-4 sm:py-3 ${index === 0 ? "border-r border-white/[0.04]" : ""}`}
                            style={{ color: isPrimaryColumnHeader(header) ? "#E5E7EB" : "#00FF00" }}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displaySizeTable.extra.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t border-white/[0.04]">
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className={`whitespace-nowrap px-2 py-2.5 text-[11px] text-gray-200 sm:px-4 sm:py-3 sm:text-sm ${cellIndex === 0 ? "border-r border-white/[0.04] text-xs font-bold sm:text-sm" : ""}`}
                            >
                              {displayTableCell(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeRowIndex !== null && recommendations.length > 0 && (
            <div ref={recommendationsRef} className="mt-4 [&>h5]:hidden">
              <button
                type="button"
                onClick={() => setIsSimilarProductsOpen((value) => !value)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-left transition hover:border-white/[0.14] hover:bg-white/[0.055]"
              >
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-widest text-gray-400">실측이 가까운 상품</h5>
                  <p className="mt-1 text-xs font-semibold text-gray-500">선택한 사이즈와 비슷한 상품 {recommendations.length}개</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isSimilarProductsOpen ? "rotate-180" : ""}`} />
              </button>
              {isSimilarProductsOpen && (
              <>
              <h5 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">유사한 추천 상품</h5>
              <div className="flex flex-col gap-2">
                {recommendations.map(({ product: recProduct, rowIndex }) => {
                  const recSizeTable = getDisplaySizeTable(recProduct)!;
                  const matchedRow = recSizeTable.rows[rowIndex];
                  const sizeLabel = matchedRow[0] || "";
                  const measurementDiffs = compareMeasurementSnapshots(
                    activeProductSnapshot,
                    { headers: recSizeTable.headers, row: matchedRow }
                  ).slice(0, 4);
                  return (
                    <button
                      key={recProduct.id}
                      type="button"
                      onClick={() => onRecommendationClick(recProduct)}
                      className="flex items-start gap-3 rounded-2xl bg-white/[0.05] px-4 py-3 text-left transition hover:bg-white/[0.1] active:scale-[0.98]"
                    >
                      <img
                        src={recProduct.thumbnailImage || recProduct.image || DEFAULT_PRODUCT_PLACEHOLDER}
                        alt={recProduct.name}
                        className="mt-0.5 h-12 w-12 flex-shrink-0 rounded-xl bg-white/[0.06] object-contain"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold uppercase text-orange-400">{recProduct.brand}</p>
                        <p className="truncate text-sm font-medium text-white">{recProduct.name}</p>
                        {measurementDiffs.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {measurementDiffs.map((item) => {
                              const diffText =
                                item.diff === 0
                                  ? "같음"
                                  : `${item.diff > 0 ? "+" : ""}${item.diff.toFixed(1).replace(/\.0$/, "")}cm`;
                              const tone =
                                item.diff === 0
                                  ? "text-gray-300"
                                  : item.diff > 0
                                  ? "text-orange-300"
                                  : "text-sky-300";
                              return (
                                <span key={item.label} className={`rounded-md bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-semibold ${tone}`}>
                                  {item.label} {diffText}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-bold text-white">{sizeLabel}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              </>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
    {isSizeSheetOpen && (
      <SizeSelectionSheet
        product={displayProduct}
        initialRowIndex={activeRowIndex}
        onClose={() => setIsSizeSheetOpen(false)}
        onConfirm={handleConfirmClosetSize}
      />
    )}
    </>
  );
}
