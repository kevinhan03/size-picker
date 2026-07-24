"use client";

import { type MouseEvent, type SyntheticEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { ProgressiveImage } from "./ProgressiveImage";
import type { TutorialAnchorRect } from "./OnboardingTutorial";
import type { Product } from "../types";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Retained to preserve the existing module imports.
import { CATEGORY_OPTIONS } from "../constants";

// Initial estimate — virtualizer corrects with actual measurements via measureElement
const ROW_HEIGHT_ESTIMATE = 360;

interface GridViewProps {
  allProducts: Product[];
  filteredGridProducts: Product[];
  gridCategoryCounts: Record<string, number>;
  gridCategoryFilter: string;
  setGridCategoryFilter: (value: string) => void;
  gridSearchQuery: string;
  setGridSearchQuery: (value: string) => void;
  onProductClick: (product: Product, anchorRect?: TutorialAnchorRect) => void;
  onImageError: (event: SyntheticEvent<HTMLImageElement>) => void;
  isInteractionDisabled?: boolean;
  isLoading?: boolean;
}

export function GridView({
  allProducts,
  filteredGridProducts,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Retained to preserve the existing component contract.
  gridCategoryCounts,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Retained to preserve the existing component contract.
  gridCategoryFilter,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Retained to preserve the existing component contract.
  setGridCategoryFilter,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Retained to preserve the existing component contract.
  gridSearchQuery,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Retained to preserve the existing component contract.
  setGridSearchQuery,
  onProductClick,
  onImageError,
  isInteractionDisabled = false,
  isLoading = false,
}: GridViewProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [colCount, setColCount] = useState(2);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    const check = () => setColCount(window.innerWidth >= 1024 ? 4 : 2);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useLayoutEffect(() => {
    setScrollMargin(gridRef.current?.offsetTop ?? 0);
  }, [filteredGridProducts.length]);

  const rows = useMemo<Product[][]>(() => {
    const result: Product[][] = [];
    for (let i = 0; i < filteredGridProducts.length; i += colCount) {
      result.push(filteredGridProducts.slice(i, i + colCount));
    }
    return result;
  }, [filteredGridProducts, colCount]);

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    overscan: 3,
    scrollMargin,
  });

  const getAnchorRect = (event: MouseEvent<HTMLElement>): TutorialAnchorRect => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
  };

  return (
    <div className={`w-full max-w-7xl ${isInteractionDisabled ? "pointer-events-none" : ""}`}>

      {isLoading && allProducts.length === 0 ? (
        <div className="py-20 text-center text-gray-500">상품을 불러오는 중입니다.</div>
      ) : allProducts.length === 0 ? (
        <div className="py-20 text-center text-gray-500">등록된 상품이 없습니다.</div>
      ) : filteredGridProducts.length === 0 ? (
        <div className="py-20 text-center text-gray-500">검색 조건에 맞는 상품이 없습니다.</div>
      ) : (
        <div
          ref={gridRef}
          style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
        >
          {virtualizer.getVirtualItems().map((vRow) => (
            <div
              key={vRow.key}
              data-index={vRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${vRow.start - scrollMargin}px)`,
              }}
              className="grid grid-cols-2 gap-3 pb-3 lg:grid-cols-4 lg:gap-5 lg:pb-5"
            >
              {rows[vRow.index].map((product) => (
                <div
                  key={product.id}
                  onClick={(event) => onProductClick(product, getAnchorRect(event))}
                  className={`ui-product-card ui-card-lift relative flex h-full flex-col overflow-hidden rounded-[22px] border border-white/[0.09] bg-[linear-gradient(180deg,rgba(25,25,29,0.98),rgba(15,15,18,0.98))] shadow-[0_14px_34px_rgba(0,0,0,0.18)] transition-transform duration-150 [transition-timing-function:var(--ease-out)] active:scale-[0.98] ${
                    isInteractionDisabled
                      ? "cursor-default"
                      : "cursor-pointer"
                  }`}
                >
                  <div className="relative mx-1.5 mb-0 mt-1.5 h-44 overflow-hidden rounded-[18px] bg-[linear-gradient(180deg,rgba(17,24,39,0.62),rgba(0,0,0,0.38))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:m-3 sm:h-48 sm:rounded-[18px]">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.07),transparent_28%)]" />
                    <div className="absolute inset-3 z-[1] sm:inset-4">
                      <ProgressiveImage
                        src={product.image}
                        thumbnailSrc={product.thumbnailImage}
                        alt={product.name}
                        className="rounded-[10px] object-contain"
                        loading={vRow.index === 0 ? "eager" : "lazy"}
                        onError={onImageError}
                      />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col bg-black/[0.06] px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
                    <div className="mb-1 flex min-w-0 items-center gap-2">
                      <div className="truncate text-xs font-bold tracking-wide text-orange-500">{product.brand}</div>
                      {product.isInstagram && (
                        <span className="flex-shrink-0 rounded-md border border-orange-500/35 bg-orange-500/[0.12] px-1.5 py-0.5 text-[9px] font-black leading-none text-orange-300">
                          PICK
                        </span>
                      )}
                    </div>
                    <h3 className="mb-2 line-clamp-2 text-[0.95rem] font-bold leading-tight text-white sm:text-lg">{product.name}</h3>
                    <div className="mt-auto pt-2 text-center text-sm text-gray-300">{product.category}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
