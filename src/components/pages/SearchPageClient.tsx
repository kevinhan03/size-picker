"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, SyntheticEvent } from "react";
import { ArrowUp, ArrowUpRight, RefreshCw, Search, ShieldAlert, X } from "lucide-react";
import { BrandExplorer, type BrandSummary } from "../BrandExplorer";
import { GridView } from "../GridView";
import { FilterBar } from "../FilterBar";
import { ProductDetailModal } from "../ProductDetailModal";
import { ImageViewerOverlay } from "../ImageViewerOverlay";
import { ProgressiveImage } from "../ProgressiveImage";
import { OnboardingTutorial, type TutorialAnchorRect, type TutorialId } from "../OnboardingTutorial";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { useProductsContext } from "../../contexts/ProductsContext";
import { useSearchContext } from "../../contexts/SearchContext";
import { useGridState } from "../../hooks/useGridState";
import { getProductPageUrl, toPublicUrl } from "../../utils/product";
import type { Product } from "../../types";

const TUTORIAL_IDS = [
  "search",
  "filters",
  "detail",
  "collection",
  "sizeSelection",
  "sizeRecommendations",
  "mySizeCompare",
  "mySizeSetup",
  "digboxShare",
] as const satisfies readonly TutorialId[];
const TUTORIAL_STORAGE_PREFIX = "sizepicker:tutorial:v2:";
const GUEST_DIGBOX_FIRST_SAVE_STORAGE_KEY = "sizepicker:guest-digbox-first-save:v1";

const normalizeBrandKey = (brand: string) => brand.trim().replace(/\s+/g, " ").toLocaleLowerCase();

const getRequestedTutorialId = (value: string | null): TutorialId | null => {
  if (!value) return null;
  return TUTORIAL_IDS.includes(value as TutorialId) ? (value as TutorialId) : null;
};

const resetTutorialStorage = (tutorialId?: TutorialId) => {
  if (tutorialId) {
    window.localStorage.removeItem(`${TUTORIAL_STORAGE_PREFIX}${tutorialId}`);
    return;
  }
  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(TUTORIAL_STORAGE_PREFIX))
    .forEach((key) => window.localStorage.removeItem(key));
};

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
  const { products, isProductsLoading, productsError, retryProductsLoad } = useProductsContext();
  const { authUser, isAuthLoading } = useAuthContext();
  const { toggleCloset, isInCloset, ensureLoaded: ensureClosetLoaded } = useClosetContext();
  const {
    toggleDigbox,
    isInDigbox,
    ensureLoaded: ensureDigboxLoaded,
    guestCount,
    isGuestHydrated,
  } = useDigboxContext();
  const {
    clearQuery,
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
  const [brandFilter, setBrandFilter] = useState("");
  const [isBrandExplorerOpen, setIsBrandExplorerOpen] = useState(false);
  const [showGuestSaveHint, setShowGuestSaveHint] = useState(false);
  const [showGuestDetailSaveHint, setShowGuestDetailSaveHint] = useState(false);
  const [isScrollTopVisible, setIsScrollTopVisible] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<{ id: TutorialId; anchorRect?: TutorialAnchorRect } | null>(null);
  const gridModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureClosetLoaded();
    ensureDigboxLoaded();
  }, [ensureClosetLoaded, ensureDigboxLoaded]);

  useEffect(() => {
    const updateScrollTopVisibility = () => setIsScrollTopVisible(window.scrollY > 160);

    updateScrollTopVisibility();
    window.addEventListener("scroll", updateScrollTopVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollTopVisibility);
  }, []);

  useEffect(() => {
    const shouldShowHint = !isAuthLoading && !authUser && isGuestHydrated && guestCount === 0 && products.length > 0;
    if (!shouldShowHint || window.localStorage.getItem(GUEST_DIGBOX_FIRST_SAVE_STORAGE_KEY)) {
      setShowGuestSaveHint(false);
      return;
    }
    setShowGuestSaveHint(true);
  }, [authUser, guestCount, isAuthLoading, isGuestHydrated, products.length]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("focusSearch") !== "1") return;

    const timer = window.setTimeout(() => {
      const input = document.getElementById("main-product-search") as HTMLInputElement | null;
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
      input?.focus();

      params.delete("focusSearch");
      const nextQuery = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`);
    }, 150);

    return () => window.clearTimeout(timer);
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
    () => (brandFilter ? grid.filteredGridProducts.filter((product) => normalizeBrandKey(product.brand) === normalizeBrandKey(brandFilter)) : grid.filteredGridProducts),
    [brandFilter, grid.filteredGridProducts]
  );

  const brandSummaries = useMemo<BrandSummary[]>(() => {
    const summaries = new Map<string, BrandSummary>();
    for (const product of products) {
      const name = product.brand.trim().replace(/\s+/g, " ");
      if (!name) continue;
      const key = normalizeBrandKey(name);
      const createdAt = product.createdAt && Number.isFinite(Date.parse(product.createdAt)) ? product.createdAt : null;
      const current = summaries.get(key);
      const currentTime = current?.latestCreatedAt ? Date.parse(current.latestCreatedAt) : 0;
      const nextTime = createdAt ? Date.parse(createdAt) : 0;
      if (!current) {
        summaries.set(key, { name, itemCount: 1, latestCreatedAt: createdAt });
      } else {
        current.itemCount += 1;
        if (nextTime > currentTime) {
          current.name = name;
          current.latestCreatedAt = createdAt;
        }
      }
    }
    return Array.from(summaries.values()).sort((a, b) => {
      const aTime = a.latestCreatedAt ? Date.parse(a.latestCreatedAt) : 0;
      const bTime = b.latestCreatedAt ? Date.parse(b.latestCreatedAt) : 0;
      return bTime - aTime || a.name.localeCompare(b.name, "ko");
    });
  }, [products]);

  const brandSuggestions = useMemo(() => {
    const normalizedQuery = normalizeBrandKey(query);
    if (!normalizedQuery) return [];
    return brandSummaries
      .filter((brand) => normalizeBrandKey(brand.name).includes(normalizedQuery))
      .map((brand) => brand.name)
      .sort((a, b) => a.localeCompare(b, "ko"));
  }, [brandSummaries, query]);

  const brandCountByName = useMemo(
    () => new Map(brandSummaries.map((brand) => [brand.name, brand.itemCount])),
    [brandSummaries]
  );

  const recentBrandOptions = useMemo(
    () => brandSummaries.slice(0, 6).map(({ name: brand, itemCount: count }) => ({ brand, count })),
    [brandSummaries]
  );

  useEffect(() => {
    const handlePopState = () => {
      setSelectedProduct(null);
      setActiveRowIndex(null);
      setIsDetailImageZoomed(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const getAnchorRect = (element: Element): TutorialAnchorRect => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
  };

  const showTutorialOnce = (tutorialId: TutorialId, anchorRect?: TutorialAnchorRect) => {
    const storageKey = `sizepicker:tutorial:v2:${tutorialId}`;
    if (window.localStorage.getItem(storageKey)) return;
    window.localStorage.setItem(storageKey, "true");
    setActiveTutorial({ id: tutorialId, anchorRect });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTutorial = getRequestedTutorialId(params.get("tutorial"));
    const shouldResetTutorials =
      params.get("tutorial") === "reset" || params.get("resetTutorials") === "1";

    if (shouldResetTutorials || requestedTutorial) {
      resetTutorialStorage(requestedTutorial ?? undefined);
    }

    if (!requestedTutorial) return;

    const timer = window.setTimeout(() => {
      const rect = requestedTutorial === "search"
        ? searchContainerRef.current?.getBoundingClientRect()
        : null;
      setActiveTutorial({
        id: requestedTutorial,
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
    }, 120);

    return () => window.clearTimeout(timer);
  }, [searchContainerRef]);

  const handleBrandSelect = (brand: string) => {
    const anchorRect = searchContainerRef.current ? getAnchorRect(searchContainerRef.current) : undefined;
    showTutorialOnce("filters", anchorRect);
    setBrandFilter(brand);
    grid.setGridSearchQuery("");
    setShowSuggestions(false);
    setIsBrandExplorerOpen(false);
    clearQuery();
  };

  const handleClearBrand = () => {
    setBrandFilter("");
    setIsBrandExplorerOpen(false);
  };

  const handleCategoryFilterChange = (value: string, anchorRect?: TutorialAnchorRect) => {
    showTutorialOnce("filters", anchorRect);
    grid.setGridCategoryFilter(value);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    const term = query.trim();
    grid.setGridSearchQuery(term);
    setShowSuggestions(false);
  };

  const handleProductClick = (product: Product, anchorRect?: TutorialAnchorRect) => {
    if (!isAuthLoading && !authUser && isGuestHydrated && guestCount === 0 && !window.localStorage.getItem(GUEST_DIGBOX_FIRST_SAVE_STORAGE_KEY)) {
      setShowGuestDetailSaveHint(true);
    }
    setSelectedProduct(product);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
    showTutorialOnce("detail", anchorRect);
    window.history.pushState(null, "", getProductPageUrl(product));
  };

  const handleGridClose = () => {
    setSelectedProduct(null);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
    setShowGuestDetailSaveHint(false);
    window.history.back();
  };

  const handleGridRecommendationClick = (product: Product, anchorRect?: TutorialAnchorRect) => {
    setSelectedProduct(product);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
    showTutorialOnce("detail", anchorRect);
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
      <div className="relative mb-4 w-full max-w-3xl" ref={searchContainerRef}>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className={`h-5 w-5 transition-colors ${showSuggestions ? "text-orange-500" : "text-gray-500"}`} />
        </div>
        <input
          id="main-product-search"
          type="text"
          className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-12 pr-10 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_32px_rgba(0,0,0,0.24)] outline-none transition placeholder:text-gray-600 focus:border-orange-500/60 focus:bg-white/[0.08] focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_3px_rgba(249,115,22,0.12)]"
          placeholder="브랜드명 또는 상품명을 검색해보세요"
          value={query}
          onChange={(e) => {
            handleQueryChange(e.target.value);
          }}
          onKeyDown={handleSearchKeyDown}
          onFocus={(event) => {
            setShowSuggestions(true);
            showTutorialOnce("search", getAnchorRect(event.currentTarget));
          }}
        />
        {query && (
          <button
            onClick={() => {
              grid.setGridSearchQuery("");
              clearQuery();
            }}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center border-none bg-transparent p-0 text-gray-400 outline-none transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {showSuggestions && (
          <div className="search-discovery-popover ui-floating-surface absolute left-0 right-0 top-full z-20 mt-2 max-h-[420px] origin-top overflow-hidden overflow-y-auto rounded-2xl border border-white/[0.12] bg-[#111114]/95 shadow-[0_20px_48px_rgba(0,0,0,0.42)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {!query ? (
              brandSummaries.length > 0 ? (
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between gap-3 px-0.5">
                    <div className="text-xs font-semibold text-gray-300">최근 등록 브랜드</div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBrandExplorerOpen(true);
                        setShowSuggestions(false);
                      }}
                      className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-semibold text-gray-400 transition-[color,background-color,transform] hover:bg-white/[0.06] hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80"
                    >
                      전체 보기 <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {recentBrandOptions.map(({ brand, count }) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => handleBrandSelect(brand)}
                        className="recent-brand-card ui-card flex min-w-0 flex-col items-start rounded-xl px-3 py-3 text-left transition-[background-color,border-color,color,transform] hover:border-orange-400/45 hover:bg-orange-500/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80"
                      >
                        <span className="w-full truncate text-xs font-bold text-gray-200">{brand}</span>
                        <span className="mt-1 text-[11px] font-medium text-gray-500">등록 상품 {count}개</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-sm font-semibold text-gray-300">아직 등록된 브랜드가 없어요.</p>
                  <p className="mt-1 text-xs text-gray-500">상품을 추가하면 여기에서 브랜드를 바로 찾을 수 있어요.</p>
                </div>
              )
            ) : brandSuggestions.length > 0 || suggestions.length > 0 ? (
              <>
                {brandSuggestions.length > 0 && (
                  <>
                    <div className="px-5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">브랜드</div>
                    <ul>
                      {brandSuggestions.map((brand) => (
                        <li key={brand} className="border-b border-white/10 last:border-0">
                          <button
                            type="button"
                            onClick={() => handleBrandSelect(brand)}
                            className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-[background-color,color] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400/80"
                          >
                            <span className="flex min-w-0 items-center gap-3">
                            <Search className="h-4 w-4 flex-shrink-0 text-gray-500" />
                            <span className="truncate text-sm"><HighlightMatch text={brand} query={query} /></span>
                          </span>
                          <span className="text-xs font-bold text-gray-500">{brandCountByName.get(brand) ?? 0}</span>
                          </button>
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
                        <li key={item.id} className="border-b border-white/10 last:border-0">
                          <button
                            type="button"
                            onClick={() => handleSearchSubmit(item)}
                            className="flex w-full items-center gap-4 px-5 py-4 text-left transition-[background-color,color] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400/80"
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
                          </button>
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

      <FilterBar
        categoryValue={grid.gridCategoryFilter}
        onCategoryChange={handleCategoryFilterChange}
      />

      <div className="w-full max-w-7xl dig-grid">
        {!isAuthLoading && !authUser && showGuestSaveHint && (
          <p className="mb-4 rounded-xl border border-yellow-300/20 bg-yellow-400/[0.07] px-4 py-3 text-center text-sm font-semibold text-yellow-100">
            마음에 드는 상품을 열어 저장하면 내 취향을 찾아드려요.
          </p>
        )}
        {brandFilter && (
          <div className="mb-4 flex items-center justify-between gap-3 px-0.5 text-sm sm:text-base">
            <p className="min-w-0 truncate font-semibold text-white">
              <span className="text-orange-300">{brandFilter}</span> 상품 {brandFilteredProducts.length}개
            </p>
            <button
              type="button"
              onClick={handleClearBrand}
              className="flex h-9 flex-shrink-0 items-center rounded-xl border border-white/[0.12] bg-white/[0.055] px-3 text-xs font-bold text-gray-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition duration-200 hover:-translate-y-px hover:border-orange-300/45 hover:bg-orange-500/[0.11] hover:text-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11131a]"
            >
              선택 해제
            </button>
          </div>
        )}
        <GridView
          allProducts={products}
          filteredGridProducts={brandFilteredProducts}
          gridCategoryCounts={grid.gridCategoryCounts}
          gridCategoryFilter={grid.gridCategoryFilter}
          setGridCategoryFilter={grid.setGridCategoryFilter}
          gridSearchQuery={grid.gridSearchQuery}
          setGridSearchQuery={grid.setGridSearchQuery}
          isInteractionDisabled={showSuggestions}
          onProductClick={handleProductClick}
          onImageError={handleImageLoadError}
          isLoading={isProductsLoading}
        />
      </div>

      {isScrollTopVisible && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="맨 위로 이동"
          title="맨 위로 이동"
          className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/[0.1] text-white shadow-[0_12px_32px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-orange-300/55 hover:bg-white/[0.16] hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11131a] md:bottom-7 md:right-7"
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2.25} />
        </button>
      )}

      {isBrandExplorerOpen && (
        <BrandExplorer
          onClose={() => setIsBrandExplorerOpen(false)}
          brands={brandSummaries}
          selectedBrand={brandFilter}
          onSelectBrand={handleBrandSelect}
          onClearBrand={handleClearBrand}
        />
      )}

      {normalizedProduct && (
        <ProductDetailModal
          product={normalizedProduct}
          activeRowIndex={activeRowIndex}
          onClose={handleGridClose}
          onRowClick={(rowIndex) => setActiveRowIndex(rowIndex)}
          onRecommendationClick={handleGridRecommendationClick}
          onZoomImage={() => setIsDetailImageZoomed(true)}
          onImageError={handleImageLoadError}
          modalRef={gridModalRef}
          onCollectionActionStart={(anchorRect) => showTutorialOnce("collection", anchorRect)}
          onToggleCloset={(selection) => {
            toggleCloset(normalizedProduct.id, selection);
          }}
          isInCloset={isInCloset(normalizedProduct.id)}
          onToggleDigbox={() => {
            setShowGuestDetailSaveHint(false);
            if (!authUser && !isInDigbox(normalizedProduct.id)) {
              window.localStorage.setItem(GUEST_DIGBOX_FIRST_SAVE_STORAGE_KEY, "true");
              setShowGuestSaveHint(false);
            }
            toggleDigbox(normalizedProduct.id, "home_product_detail");
          }}
          isInDigbox={isInDigbox(normalizedProduct.id)}
          showGuestDigboxHint={showGuestDetailSaveHint}
          relatedGraphButtonLabel="비슷한 상품"
          analyticsSource="home_grid"
        />
      )}

      {normalizedProduct && <ImageViewerOverlay open={isDetailImageZoomed} src={normalizedProduct.image} alt={normalizedProduct.name} onClose={() => setIsDetailImageZoomed(false)} />}

      {activeTutorial && (
        <OnboardingTutorial
          tutorialId={activeTutorial.id}
          anchorRect={activeTutorial.anchorRect}
          onClose={() => setActiveTutorial(null)}
        />
      )}
    </main>
  );
}
