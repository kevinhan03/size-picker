"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { Instagram, RefreshCw, Search, ShieldAlert, X } from "lucide-react";
import { GridView } from "../GridView";
import { ProductDetailModal } from "../ProductDetailModal";
import { ProgressiveImage } from "../ProgressiveImage";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useProductsContext } from "../../contexts/ProductsContext";
import { useSearchContext } from "../../contexts/SearchContext";
import { useGridState } from "../../hooks/useGridState";
import { getProductPageUrl, toPublicUrl } from "../../utils/product";
import { computeSizeRecommendations } from "../../utils/sizeTable";
import { smoothScrollTo } from "../../utils/scroll";
import type { Product, SizeRecommendation } from "../../types";
import { CATEGORY_OPTIONS } from "../../constants";

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <>
      {idx > 0 && <span className="text-white">{text.slice(0, idx)}</span>}
      <span className="text-gray-400">{text.slice(idx, idx + query.length)}</span>
      {idx + query.length < text.length && (
        <span className="font-bold text-white">{text.slice(idx + query.length)}</span>
      )}
    </>
  );
}

export function SearchPageClient() {
  const { products, featuredProducts, productsError, retryProductsLoad } = useProductsContext();
  const { toggleCloset, isInCloset } = useClosetContext();
  const {
    clearQuery,
    handleKeyDown,
    handleQueryChange,
    handleSearchSubmit,
    query,
    searchContainerRef,
    setShowSuggestions,
    showSuggestions,
    suggestions,
  } = useSearchContext();
  const grid = useGridState(products);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [isDetailImageZoomed, setIsDetailImageZoomed] = useState(false);
  const [instagramProfileUrl, setInstagramProfileUrl] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const gridModalRef = useRef<HTMLDivElement>(null);
  const gridRecommendationsRef = useRef<HTMLDivElement>(null);

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

  const brandFilteredProducts = useMemo(
    () => (brandFilter ? grid.filteredGridProducts.filter((p) => p.brand === brandFilter) : grid.filteredGridProducts),
    [brandFilter, grid.filteredGridProducts]
  );

  const categoryFilters = useMemo(
    () => ["", ...CATEGORY_OPTIONS.filter((c) => c !== "기타 상품(빈티지)")],
    []
  );

  const brandSuggestions = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return [...new Set(products.filter((p) => p.brand.toLowerCase().includes(q)).map((p) => p.brand))].sort();
  }, [query, products]);

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
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-orange-500">Editor&apos;s Pick</p>
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
                        loading="eager"
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
      <div className="relative mb-4 w-full max-w-2xl" ref={searchContainerRef}>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className={`h-5 w-5 transition-colors ${showSuggestions ? "text-orange-500" : "text-gray-500"}`} />
        </div>
        <input
          type="text"
          className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-12 pr-10 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_32px_rgba(0,0,0,0.24)] outline-none transition placeholder:text-gray-600 focus:border-orange-500/60 focus:bg-white/[0.08] focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_3px_rgba(249,115,22,0.12)] sm:h-[52px]"
          placeholder="브랜드명 또는 상품명을 검색해보세요"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query) setShowSuggestions(true);
          }}
        />
        {query && (
          <button
            onClick={clearQuery}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center border-none bg-transparent p-0 text-gray-400 shadow-none outline-none transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {showSuggestions && (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-hidden overflow-y-auto rounded-2xl border border-white/10 bg-[#111114]/95 shadow-[0_20px_48px_rgba(0,0,0,0.42)] backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {brandSuggestions.length > 0 || suggestions.length > 0 ? (
              <>
                {brandSuggestions.length > 0 && (
                  <>
                    <div className="px-5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">브랜드</div>
                    <ul>
                      {brandSuggestions.map((brand) => (
                        <li
                          key={brand}
                          onClick={() => { setBrandFilter(brand); grid.setGridCategoryFilter(""); setShowSuggestions(false); clearQuery(); }}
                          className="flex cursor-pointer items-center gap-3 border-b border-white/10 px-5 py-3 transition-colors last:border-0 hover:bg-white/[0.06]"
                        >
                          <Search className="h-4 w-4 flex-shrink-0 text-gray-500" />
                          <span className="text-sm"><HighlightMatch text={brand} query={query} /></span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {suggestions.length > 0 && (
                  <>
                    {brandSuggestions.length > 0 && <div className="border-t border-white/10" />}
                    <div className="px-5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">상품</div>
                    <ul>
                      {suggestions.map((item) => (
                        <li
                          key={item.id}
                          onClick={() => handleSearchSubmit(item)}
                          className="flex cursor-pointer items-center gap-4 border-b border-white/10 px-5 py-4 transition-colors last:border-0 hover:bg-white/[0.06]"
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
                            <div className="font-medium"><HighlightMatch text={item.name} query={query} /></div>
                            <div className="text-sm text-gray-400">{item.brand} · {item.category}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                검색어와 일치하는 추천 상품이 없습니다.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category filter */}
      <div className="mb-8 w-full max-w-2xl">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {categoryFilters.map((cat) => {
            const label = cat === "" ? "All" : cat;
            const isActive = grid.gridCategoryFilter === cat && !brandFilter;
            const count = cat === "" ? products.length : grid.gridCategoryCounts[cat] || 0;
            return (
              <button
                key={label}
                onClick={() => { grid.setGridCategoryFilter(cat); setBrandFilter(""); }}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-xl border px-2 text-[11px] font-black transition-all sm:h-10 sm:text-xs ${
                  isActive
                    ? "border-orange-500/55 bg-orange-500/12 text-orange-400 shadow-[0_8px_20px_rgba(249,115,22,0.12)]"
                    : "border-white/10 bg-white/[0.045] text-gray-400 hover:border-white/18 hover:bg-white/[0.07] hover:text-gray-100"
                }`}
              >
                <span>{label}</span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] leading-none ${
                    isActive ? "bg-orange-500/18 text-orange-300" : "bg-white/[0.06] text-gray-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active brand filter */}
        {brandFilter && (
          <div className="mt-2.5 flex items-center justify-between gap-3 text-xs font-bold">
            <p className="min-w-0 truncate text-gray-500">
              Brand filter <span className="text-gray-700">·</span>{" "}
              <span className="text-orange-400">{brandFilter}</span>
            </p>
            <button
              onClick={() => setBrandFilter("")}
              className="shrink-0 border-none bg-transparent p-0 text-xs font-black text-gray-500 shadow-none transition hover:text-white"
            >
              Clear
            </button>
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
          onToggleCloset={(selection) => toggleCloset(normalizedProduct.id, selection)}
          isInCloset={isInCloset(normalizedProduct.id)}
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
