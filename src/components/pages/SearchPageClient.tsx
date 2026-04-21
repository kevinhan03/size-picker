"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { ChevronDown } from "lucide-react";
import { Instagram, RefreshCw, Search, ShieldAlert, X } from "lucide-react";
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
  const { products, featuredProducts, productsError, retryProductsLoad } = useProductsContext();
  const search = useSearchContext();
  const grid = useGridState(products);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [isDetailImageZoomed, setIsDetailImageZoomed] = useState(false);
  const [instagramProfileUrl, setInstagramProfileUrl] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [showBrandDrop, setShowBrandDrop] = useState(false);
  const gridModalRef = useRef<HTMLDivElement>(null);
  const gridRecommendationsRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((payload) => {
        if (payload?.ok) setInstagramProfileUrl(payload.data?.instagramUrl ?? "");
      })
      .catch(() => {});
  }, []);

  const normalizedProduct = useMemo<Product | null>(() => {
    if (!selectedProduct) return null;
    const imagePath = String(selectedProduct.imagePath || "").trim();
    const image = imagePath ? toPublicUrl(imagePath) : selectedProduct.image;
    const thumbnailImage = imagePath
      ? toPublicUrl(imagePath, { width: 320, height: 320, quality: 65 })
      : selectedProduct.thumbnailImage;
    return { ...selectedProduct, image, thumbnailImage };
  }, [selectedProduct]);

  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand))].sort(),
    [products]
  );

  const brandFilteredProducts = useMemo(
    () => (brandFilter ? grid.filteredGridProducts.filter((p) => p.brand === brandFilter) : grid.filteredGridProducts),
    [brandFilter, grid.filteredGridProducts]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) {
        setShowBrandDrop(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

      {/* Editor's Pick banner */}
      {featuredProducts.length > 0 && (
        <div className="mb-8 w-full max-w-2xl">
          {/* 헤더 */}
          <div className="mb-3 flex items-end justify-between sm:mb-4">
            <div>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-orange-500">Editor's Pick</p>
              <h2 className="text-lg font-black leading-tight text-white sm:text-xl">지금 주목할 상품</h2>
            </div>
            {instagramProfileUrl && (
              <a
                href={instagramProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-gray-400 transition hover:border-pink-500/40 hover:bg-pink-500/10 hover:text-pink-400 sm:px-3 sm:py-1.5 sm:text-xs"
              >
                <Instagram className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Instagram
              </a>
            )}
          </div>
          {/* 카드 3열 고정 */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {featuredProducts.slice(0, 3).map((product) => {
              const imgSrc = product.imagePath
                ? toPublicUrl(product.imagePath, { width: 480, height: 480, quality: 75 })
                : product.image;
              return (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] text-left shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur transition hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-[0_8px_32px_rgba(249,115,22,0.15)] active:scale-95 sm:rounded-2xl"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/30">
                    {imgSrc && (
                      <ProgressiveImage
                        src={imgSrc}
                        alt={product.name}
                        className="object-cover transition duration-300 group-hover:scale-105"
                        onError={handleImageLoadError}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  </div>
                  <div className="px-2 py-2 sm:px-3 sm:py-3">
                    <p className="truncate text-[9px] font-black uppercase tracking-wide text-orange-400 sm:text-[10px]">{product.brand}</p>
                    <p className="truncate text-[11px] font-semibold leading-snug text-white sm:text-sm">{product.name}</p>
                  </div>
                </button>
              );
            })}
          </div>
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

      {/* Category filter pills + Brand button */}
      <div className="mb-12 w-full max-w-2xl">
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(6, 1fr) auto" }}>
          {(["", ...CATEGORY_OPTIONS.filter((c) => c !== "기타 상품(빈티지)")] as const).map((cat) => {
            const label = cat === "" ? "전체" : cat;
            const isActive = grid.gridCategoryFilter === cat && !brandFilter;
            return (
              <button
                key={label}
                onClick={() => { grid.setGridCategoryFilter(cat); setBrandFilter(""); }}
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

          {/* Brand dropdown button */}
          <div ref={brandRef} className="relative">
            <button
              onClick={() => setShowBrandDrop((v) => !v)}
              className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all ${
                brandFilter
                  ? "bg-orange-500 text-black shadow-[0_0_12px_rgba(249,115,22,0.5)]"
                  : showBrandDrop
                  ? "border border-orange-500/60 bg-white/5 text-orange-400"
                  : "border border-white/20 bg-white/5 text-gray-300 hover:border-orange-500/60 hover:text-orange-400"
              }`}
            >
              {brandFilter
                ? brandFilter.split(" ")[0] + (brandFilter.split(" ").length > 1 ? "…" : "")
                : "브랜드"}
              <ChevronDown
                className="h-3 w-3 transition-transform"
                style={{ transform: showBrandDrop ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>

            {showBrandDrop && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-30 min-w-[200px] overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(20,20,28,0.98),rgba(10,10,18,0.98))] shadow-[0_20px_48px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
                <button
                  onClick={() => { setBrandFilter(""); setShowBrandDrop(false); }}
                  className={`block w-full border-b border-white/[0.06] px-4 py-2.5 text-left text-xs font-bold tracking-wider transition-colors hover:bg-white/5 ${
                    !brandFilter ? "text-orange-500" : "text-gray-500"
                  }`}
                >
                  전체 브랜드
                </button>
                <div className="ui-brand-dropdown max-h-60 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                  {brands.map((brand) => {
                    const isActive = brandFilter === brand;
                    return (
                      <button
                        key={brand}
                        onClick={() => { setBrandFilter(brand); grid.setGridCategoryFilter(""); setShowBrandDrop(false); }}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                          isActive
                            ? "bg-orange-500/10 font-semibold text-orange-400 hover:bg-orange-500/15"
                            : "font-normal text-gray-200 hover:bg-white/5"
                        }`}
                      >
                        <span>{brand}</span>
                        {isActive && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5">
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active brand badge */}
        {brandFilter && (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-xs text-gray-500">브랜드 필터:</span>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/12 px-2.5 py-1 text-xs font-semibold text-orange-400">
              {brandFilter}
              <button
                onClick={() => setBrandFilter("")}
                className="flex items-center p-0 leading-none text-orange-400"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      <GridView
        allProducts={products}
        filteredGridProducts={brandFilteredProducts}
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
