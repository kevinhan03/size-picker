"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { RefreshCw, Search, ShieldAlert, X } from "lucide-react";
import { GridView } from "../GridView";
import { ProductDetailModal } from "../ProductDetailModal";
import { ProgressiveImage } from "../ProgressiveImage";
import { useProductsContext } from "../../contexts/ProductsContext";
import { useSearchContext } from "../../contexts/SearchContext";
import { useGridState } from "../../hooks/useGridState";
import { getProductPageUrl, toPublicUrl } from "../../utils/product";
import { computeSizeRecommendations } from "../../utils/sizeTable";
import { smoothScrollTo } from "../../utils/scroll";
import type { Product, SizeRecommendation } from "../../types";
import { CATEGORY_OPTIONS } from "../../constants";

export function SearchPageClient() {
  const { products, productsError, retryProductsLoad } = useProductsContext();
  const search = useSearchContext();
  const grid = useGridState(products);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [isDetailImageZoomed, setIsDetailImageZoomed] = useState(false);
  const gridModalRef = useRef<HTMLDivElement>(null);
  const gridRecommendationsRef = useRef<HTMLDivElement>(null);

  const normalizedProduct = useMemo<Product | null>(() => {
    if (!selectedProduct) return null;
    const imagePath = String(selectedProduct.imagePath || "").trim();
    const image = imagePath ? toPublicUrl(imagePath) : selectedProduct.image;
    const thumbnailImage = imagePath
      ? toPublicUrl(imagePath, { width: 320, height: 320, quality: 65 })
      : selectedProduct.thumbnailImage;
    return { ...selectedProduct, image, thumbnailImage };
  }, [selectedProduct]);

  const gridRecommendations = useMemo<SizeRecommendation[]>(() => {
    if (activeRowIndex === null || !selectedProduct) return [];
    return computeSizeRecommendations(selectedProduct, activeRowIndex, products);
  }, [activeRowIndex, selectedProduct, products]);

  useEffect(() => {
    const handlePopState = () => {
      setSelectedProduct(null);
      setActiveRowIndex(null);
      setIsDetailImageZoomed(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
    window.history.pushState(null, "", getProductPageUrl(product));
  };

  const handleGridClose = () => {
    setSelectedProduct(null);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
    window.history.back();
  };

  const handleGridRecommendationClick = (product: Product) => {
    setSelectedProduct(product);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
    window.history.replaceState(null, "", getProductPageUrl(product));
  };

  const handleImageLoadError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.style.display = "none";
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--app-main-pt)] text-white">
      {productsError && (
        <div className="mb-6 flex w-full max-w-4xl flex-col items-center gap-4 rounded-xl border border-orange-500 bg-orange-900/50 px-6 py-4 text-orange-200 md:flex-row">
          <div className="flex flex-1 items-center gap-2">
            <ShieldAlert className="h-6 w-6 flex-shrink-0" />
            <span className="text-sm font-medium md:text-base">{productsError}</span>
          </div>
          <button
            onClick={retryProductsLoad}
            className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-orange-800 px-4 py-2 text-sm font-bold transition hover:bg-orange-700"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      )}

      {/* Search bar below navbar */}
      <div className="relative mb-3 w-full max-w-2xl" ref={search.searchContainerRef}>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className={`h-5 w-5 transition-colors ${search.showSuggestions ? "text-orange-500" : "text-gray-500"}`} />
        </div>
        <input
          type="text"
          className="w-full rounded-full border border-gray-700 bg-gray-900 py-3 pl-12 pr-10 text-sm text-white transition-all placeholder:text-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          placeholder="브랜드명 또는 상품명을 검색해보세요"
          value={search.query}
          onChange={(e) => search.handleQueryChange(e.target.value)}
          onKeyDown={search.handleKeyDown}
          onFocus={() => {
            if (search.query) search.setShowSuggestions(true);
          }}
        />
        {search.query && (
          <button
            onClick={search.clearQuery}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {search.showSuggestions && (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-hidden overflow-y-auto rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] shadow-[0_20px_48px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
            {search.suggestions.length > 0 ? (
              <ul>
                {search.suggestions.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => search.handleSearchSubmit(item)}
                    className="flex cursor-pointer items-center gap-4 border-b border-white/10 px-5 py-4 transition-colors last:border-0 hover:bg-white/[0.08]"
                  >
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-white/10">
                      <ProgressiveImage
                        src={item.image}
                        thumbnailSrc={item.thumbnailImage}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={handleImageLoadError}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-sm text-gray-400">
                        {item.brand} · {item.category}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                검색어와 일치하는 추천 상품이 없습니다.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category filter pills */}
      <div className="mb-12 grid w-full max-w-2xl grid-cols-6 gap-2">
        {(["", ...CATEGORY_OPTIONS.filter((c) => c !== "기타 상품(빈티지)")] as const).map((cat) => {
          const label = cat === "" ? "전체" : cat;
          const isActive = grid.gridCategoryFilter === cat;
          return (
            <button
              key={label}
              onClick={() => grid.setGridCategoryFilter(cat)}
              className={`w-full rounded-full py-1.5 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-orange-500 text-black shadow-[0_0_12px_rgba(249,115,22,0.5)]"
                  : "border border-white/20 bg-white/5 text-gray-300 hover:border-orange-500/60 hover:text-orange-400"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <GridView
        allProducts={products}
        filteredGridProducts={grid.filteredGridProducts}
        gridCategoryCounts={grid.gridCategoryCounts}
        gridCategoryFilter={grid.gridCategoryFilter}
        setGridCategoryFilter={grid.setGridCategoryFilter}
        gridSearchQuery={grid.gridSearchQuery}
        setGridSearchQuery={grid.setGridSearchQuery}
        onProductClick={handleProductClick}
        onImageError={handleImageLoadError}
      />

      {normalizedProduct && (
        <ProductDetailModal
          product={normalizedProduct}
          activeRowIndex={activeRowIndex}
          onClose={handleGridClose}
          onRowClick={(rowIndex) => setActiveRowIndex(rowIndex)}
          recommendations={gridRecommendations}
          onRecommendationClick={handleGridRecommendationClick}
          onZoomImage={() => setIsDetailImageZoomed(true)}
          onImageError={handleImageLoadError}
          modalRef={gridModalRef}
          recommendationsRef={gridRecommendationsRef}
          smoothScrollTo={smoothScrollTo}
        />
      )}

      {isDetailImageZoomed && normalizedProduct && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setIsDetailImageZoomed(false)}
          onTouchStart={() => setIsDetailImageZoomed(false)}
        >
          <div className="flex h-[63vh] w-full max-w-6xl items-center justify-center">
            <img
              src={normalizedProduct.image}
              alt={normalizedProduct.name}
              className="max-h-full max-w-full cursor-pointer object-contain"
              style={{ borderRadius: "20px" }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
