"use client";

import { useMemo, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProductDetailModal } from "../ProductDetailModal";
import { SearchView } from "../views/SearchView";
import { useProductsContext } from "../../contexts/ProductsContext";
import { useProductSearch } from "../../hooks/useProductSearch";
import type { Product, SizeRecommendation } from "../../types";
import { getProductPageUrl } from "../../utils/product";
import { computeSizeRecommendations } from "../../utils/sizeTable";
import { smoothScrollTo } from "../../utils/scroll";

export function SearchPageClient() {
  const router = useRouter();
  const { products, productsError, retryProductsLoad, setProductsError } = useProductsContext();
  const [activeResultRowIndex, setActiveResultRowIndex] = useState<number | null>(null);
  const [isDetailImageZoomed, setIsDetailImageZoomed] = useState(false);

  const searchResultModalRef = useRef<HTMLDivElement>(null);
  const searchResultRecommendationsRef = useRef<HTMLDivElement>(null);

  const search = useProductSearch({
    allProducts: products,
    onSearchSettled: () => setProductsError(null),
  });

  const handleImageLoadError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.style.display = "none";
  };

  const handleSearchSubmit = (product: Product | null = null) => {
    setActiveResultRowIndex(null);
    setIsDetailImageZoomed(false);
    const found = search.handleSearch(product);
    if (found && products.some((item) => item.id === found.id)) {
      search.setResult(null);
      router.push(getProductPageUrl(found), { scroll: false });
    }
  };

  const recommendations = useMemo<SizeRecommendation[]>(() => {
    if (activeResultRowIndex === null || !search.result) return [];
    return computeSizeRecommendations(search.result, activeResultRowIndex, products);
  }, [activeResultRowIndex, products, search.result]);

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

      <SearchView
        error={search.error}
        isLoading={search.isLoading}
        onClearQuery={search.clearQuery}
        onImageLoadError={handleImageLoadError}
        onKeyDown={search.handleKeyDown}
        onQueryChange={search.setQuery}
        onSearch={() => handleSearchSubmit()}
        onSuggestionSelect={(product) => handleSearchSubmit(product)}
        onSuggestionVisibilityChange={search.setShowSuggestions}
        query={search.query}
        resultVisible={Boolean(search.result)}
        searchContainerRef={search.searchContainerRef}
        shouldHideSearchHero={search.shouldHideSearchHero}
        showSuggestions={search.showSuggestions}
        suggestions={search.suggestions}
      />

      {search.result && !products.some((product) => product.id === search.result?.id) && (
        <ProductDetailModal
          product={search.result}
          activeRowIndex={activeResultRowIndex}
          onClose={() => {
            setActiveResultRowIndex(null);
            setIsDetailImageZoomed(false);
            search.setResult(null);
          }}
          onRowClick={(rowIndex) => setActiveResultRowIndex(rowIndex)}
          recommendations={recommendations}
          onRecommendationClick={(product) => {
            setActiveResultRowIndex(null);
            setIsDetailImageZoomed(false);
            if (products.some((item) => item.id === product.id)) {
              search.setResult(null);
              router.push(getProductPageUrl(product), { scroll: false });
              return;
            }
            search.setResult(product);
          }}
          onZoomImage={() => setIsDetailImageZoomed(true)}
          onImageError={handleImageLoadError}
          modalRef={searchResultModalRef}
          recommendationsRef={searchResultRecommendationsRef}
          smoothScrollTo={smoothScrollTo}
        />
      )}

      {isDetailImageZoomed && search.result && !products.some((product) => product.id === search.result?.id) && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setIsDetailImageZoomed(false)}
          onTouchStart={() => setIsDetailImageZoomed(false)}
        >
          <div className="flex h-[63vh] w-full max-w-6xl items-center justify-center">
            <img
              src={search.result.image}
              alt={search.result.name}
              className="max-h-full max-w-full cursor-pointer object-contain"
              style={{ borderRadius: "20px" }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
