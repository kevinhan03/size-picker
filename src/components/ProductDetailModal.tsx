import type { RefObject, SyntheticEvent } from "react";
import { ExternalLink, X } from "lucide-react";
import { ProgressiveImage } from "./ProgressiveImage";
import type { Product, SizeRecommendation } from "../types";
import { DEFAULT_PRODUCT_PLACEHOLDER } from "../constants";
import { isPrimaryColumnHeader, normalizeMeasurementLabel } from "../utils/sizeTable";

interface ProductDetailModalProps {
  product: Product;
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
}

export function ProductDetailModal({
  product,
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
}: ProductDetailModalProps) {
  const handleRowClick = (rowIndex: number) => {
    onRowClick(rowIndex);
    setTimeout(() => {
      const modal = modalRef.current;
      const target = recommendationsRef.current;
      if (!modal || !target) return;
      const targetY = target.offsetTop - modal.offsetTop - 16;
      smoothScrollTo(modal, targetY);
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={modalRef}
        className="ui-product-detail-modal relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08))] shadow-[0_24px_60px_rgba(0,0,0,0.38)] backdrop-blur-2xl md:h-[80.4vh] md:max-h-none md:w-[91%] md:max-w-[58.24rem]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.2),transparent_32%,transparent_68%,rgba(255,255,255,0.08))]" />
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.02)_38%,rgba(255,255,255,0.03)_100%)] px-6 py-4 text-white">
          <h3 className="text-lg font-bold text-white sm:text-xl">상품 상세</h3>
          <button onClick={onClose} className="rounded-full p-2 text-gray-300 transition hover:bg-white/[0.08] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative z-[1] bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.02)_38%,rgba(255,255,255,0.03)_100%)] p-6 md:p-8">
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
            </div>
          </div>

          <div className="relative mt-8 overflow-x-auto rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.022)_28%,rgba(255,255,255,0.018)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018)_55%,transparent)]" />
            {product.sizeTable?.headers?.length ? (
              <table className="relative z-[1] min-w-full w-max text-center text-[11px] sm:text-sm">
                <thead className="text-[11px] sm:text-sm">
                  <tr>
                    {product.sizeTable.headers.map((header, index) => (
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
                  {product.sizeTable.rows.map((row, rowIndex) => {
                    const isActiveRow = activeRowIndex === rowIndex;
                    return (
                      <tr
                        key={rowIndex}
                        onClick={() => handleRowClick(rowIndex)}
                        className="group cursor-pointer transition-transform duration-200 active:scale-95"
                      >
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className={`whitespace-nowrap px-2 py-2.5 text-[11px] font-medium transition-all duration-200 sm:px-4 sm:py-3 sm:text-sm ${cellIndex === 0 ? "border-r border-white/[0.04] text-xs font-bold sm:text-sm" : ""} ${
                              isActiveRow
                                ? "bg-white text-black first:rounded-l-lg last:rounded-r-lg"
                                : "bg-transparent text-gray-200 group-hover:bg-white/[0.92] group-hover:text-black group-hover:first:rounded-l-lg group-hover:last:rounded-r-lg"
                            }`}
                          >
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-8 text-center text-gray-300">표시할 사이즈표 데이터가 없습니다.</div>
            )}
          </div>

          {recommendations.length > 0 && (
            <div ref={recommendationsRef} className="mt-6">
              <h5 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">유사한 추천 상품</h5>
              <div className="flex flex-col gap-2">
                {recommendations.map(({ product: recProduct, rowIndex }) => {
                  const matchedRow = recProduct.sizeTable!.rows[rowIndex];
                  const sizeLabel = matchedRow[0] || "";
                  const measurements = recProduct.sizeTable!.headers
                    .slice(1)
                    .map((header, index) => ({
                      label: normalizeMeasurementLabel(header) || header,
                      value: matchedRow[index + 1] || "",
                    }))
                    .filter(({ value }) => value !== "");
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
                        {measurements.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {measurements.map(({ label, value }) => (
                              <span key={label} className="rounded-md bg-white/[0.08] px-1.5 py-0.5 text-[10px] text-gray-300">
                                {label} {value}
                              </span>
                            ))}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
