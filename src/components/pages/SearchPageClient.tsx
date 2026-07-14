"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, SyntheticEvent } from "react";
import { RefreshCw, Search, ShieldAlert, Star, X } from "lucide-react";
import { GridView } from "../GridView";
import { FilterBar } from "../FilterBar";
import { ProductDetailModal } from "../ProductDetailModal";
import { ProgressiveImage } from "../ProgressiveImage";
import { OnboardingTutorial, type TutorialAnchorRect, type TutorialId } from "../OnboardingTutorial";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { useProductsContext } from "../../contexts/ProductsContext";
import { useSearchContext } from "../../contexts/SearchContext";
import { useGridState } from "../../hooks/useGridState";
import { getProductPageUrl, toPublicUrl } from "../../utils/product";
import { computeSizeRecommendations } from "../../utils/sizeTable";
import { smoothScrollTo } from "../../utils/scroll";
import type { Product, SizeRecommendation } from "../../types";
import { CATEGORY_OPTIONS } from "../../constants";

const mulberry32 = (seed: number) => {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleProducts = (items: Product[], seed: number): Product[] => {
  const random = mulberry32(seed);
  return items
    .map((product, index) => ({ product, index, weight: random() }))
    .sort((a, b) => a.weight - b.weight || a.index - b.index)
    .map(({ product }) => product);
};

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
  const [shuffleSeed, setShuffleSeed] = useState<number | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const displayProducts = useMemo(
    () => (shuffleSeed === null ? products : shuffleProducts(products, shuffleSeed)),
    [products, shuffleSeed]
  );
  const grid = useGridState(displayProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [isDetailImageZoomed, setIsDetailImageZoomed] = useState(false);
  const [brandFilter, setBrandFilter] = useState("");
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<{ id: TutorialId; anchorRect?: TutorialAnchorRect } | null>(null);
  const gridModalRef = useRef<HTMLDivElement>(null);
  const gridRecommendationsRef = useRef<HTMLDivElement>(null);
  const shuffleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    ensureClosetLoaded();
    ensureDigboxLoaded();
  }, [ensureClosetLoaded, ensureDigboxLoaded]);

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
    () => (brandFilter ? grid.filteredGridProducts.filter((p) => p.brand === brandFilter) : grid.filteredGridProducts),
    [brandFilter, grid.filteredGridProducts]
  );

  const categoryFilterOptions = useMemo(
    () => [
      { label: "전체", value: "" },
      ...CATEGORY_OPTIONS.map((category) => ({ label: category, value: category })),
    ],
    []
  );

  const brandSuggestions = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return [...new Set(products.filter((p) => p.brand.toLowerCase().includes(q)).map((p) => p.brand))].sort();
  }, [query, products]);

  const brandOptions = useMemo(() => {
    const counts = products.reduce<Record<string, number>>((acc, product) => {
      const brand = product.brand.trim();
      if (brand) acc[brand] = (acc[brand] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand));
  }, [products]);

  const brandCountByName = useMemo(
    () => new Map(brandOptions.map((option) => [option.brand, option.count])),
    [brandOptions]
  );

  const popularBrandOptions = useMemo(() => brandOptions.slice(0, 10), [brandOptions]);

  const brandFilterOptions = useMemo(
    () => {
      if (!isBrandDropdownOpen) return [{ label: "전체 브랜드", value: "" }];
      return [
        { label: "전체 브랜드", value: "" },
        ...Array.from(new Set(products.map((product) => product.brand.trim()).filter(Boolean)))
          .sort((a, b) => a.localeCompare(b))
          .map((brand) => ({ label: brand, value: brand })),
      ];
    },
    [isBrandDropdownOpen, products]
  );

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

  useEffect(() => {
    return () => {
      if (shuffleTimeoutRef.current) {
        clearTimeout(shuffleTimeoutRef.current);
      }
    };
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
    setShowAllBrands(false);
    setShowSuggestions(false);
    clearQuery();
  };

  const handleCategoryFilterChange = (value: string, anchorRect?: TutorialAnchorRect) => {
    showTutorialOnce("filters", anchorRect);
    grid.setGridCategoryFilter(value);
  };

  const handleBrandFilterChange = (value: string, anchorRect?: TutorialAnchorRect) => {
    showTutorialOnce("filters", anchorRect);
    setBrandFilter(value);
  };

  const handleBrandDropdownOpenChange = (isOpen: boolean, anchorRect?: TutorialAnchorRect) => {
    setIsBrandDropdownOpen(isOpen);
    if (isOpen) {
      showTutorialOnce("filters", anchorRect);
    }
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    const term = query.trim();
    grid.setGridSearchQuery(term);
    setShowSuggestions(false);
  };

  const handleShuffle = (anchorRect?: TutorialAnchorRect) => {
    showTutorialOnce("filters", anchorRect);
    if (shuffleTimeoutRef.current) {
      clearTimeout(shuffleTimeoutRef.current);
    }
    setShuffleSeed(Math.floor(Math.random() * 0xffffffff));
    setIsShuffling(true);
    shuffleTimeoutRef.current = setTimeout(() => {
      setIsShuffling(false);
      shuffleTimeoutRef.current = null;
    }, 380);
  };

  const handleProductClick = (product: Product, anchorRect?: TutorialAnchorRect) => {
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

  const showGuestValueHint = !isAuthLoading && !authUser && isGuestHydrated && guestCount === 0;

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
      <div className="relative mb-4 w-full max-w-2xl" ref={searchContainerRef}>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className={`h-5 w-5 transition-colors ${showSuggestions ? "text-orange-500" : "text-gray-500"}`} />
        </div>
        <input
          id="main-product-search"
          type="text"
          className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-12 pr-10 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_32px_rgba(0,0,0,0.24)] outline-none transition placeholder:text-gray-600 focus:border-orange-500/60 focus:bg-white/[0.08] focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_3px_rgba(249,115,22,0.12)] sm:h-[52px]"
          placeholder="브랜드명 또는 상품명을 검색해보세요"
          value={query}
          onChange={(e) => {
            setShowAllBrands(false);
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
              setShowAllBrands(false);
              grid.setGridSearchQuery("");
              clearQuery();
            }}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center border-none bg-transparent p-0 text-gray-400 shadow-none outline-none transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {showSuggestions && (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-[420px] overflow-hidden overflow-y-auto rounded-2xl border border-white/10 bg-[#111114] shadow-[0_20px_48px_rgba(0,0,0,0.42)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {!query ? (
              brandOptions.length > 0 ? (
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">인기 브랜드</div>
                    {brandOptions.length > popularBrandOptions.length && (
                      <button
                        type="button"
                        onClick={() => setShowAllBrands((value) => !value)}
                        className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-bold text-gray-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                      >
                        {showAllBrands ? "접기" : "전체 브랜드 보기"}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(showAllBrands ? brandOptions : popularBrandOptions).map(({ brand, count }) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => handleBrandSelect(brand)}
                        className="flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-left text-[11px] font-bold text-gray-300 transition hover:border-orange-500/40 hover:bg-orange-500/[0.1] hover:text-orange-300 sm:text-xs"
                      >
                        <span className="truncate">{brand}</span>
                        <span className="text-[10px] text-gray-500">{count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  등록된 브랜드가 없습니다.
                </div>
              )
            ) : brandSuggestions.length > 0 || suggestions.length > 0 ? (
              <>
                {brandSuggestions.length > 0 && (
                  <>
                    <div className="px-5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">브랜드</div>
                    <ul>
                      {brandSuggestions.map((brand) => (
                        <li
                          key={brand}
                          onClick={() => handleBrandSelect(brand)}
                          className="flex cursor-pointer items-center justify-between gap-3 border-b border-white/10 px-5 py-3 transition-colors last:border-0 hover:bg-white/[0.06]"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <Search className="h-4 w-4 flex-shrink-0 text-gray-500" />
                            <span className="truncate text-sm"><HighlightMatch text={brand} query={query} /></span>
                          </span>
                          <span className="text-xs font-bold text-gray-500">{brandCountByName.get(brand) ?? 0}</span>
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

      {showGuestValueHint && (
        <p className="mb-4 flex w-full max-w-2xl flex-wrap items-center gap-x-2 gap-y-1 px-1 text-[11px] font-semibold text-gray-500 sm:text-xs">
          <span className="flex items-center gap-1.5 text-gray-400">
            <Star className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" aria-hidden="true" />
            별을 눌러 상품을 담으면 내 관심 취향이 보여요
          </span>
          <span className="text-gray-500">로그인 없이 3개까지</span>
        </p>
      )}

      <FilterBar
        categoryOptions={categoryFilterOptions}
        categoryValue={grid.gridCategoryFilter}
        onCategoryChange={handleCategoryFilterChange}
        brandOptions={brandFilterOptions}
        brandValue={brandFilter}
        onBrandChange={handleBrandFilterChange}
        onShuffle={handleShuffle}
        isShuffling={isShuffling}
        onBrandDropdownOpenChange={handleBrandDropdownOpenChange}
      />

      <div className={`w-full max-w-7xl ${isShuffling ? "dig-grid is-shuffling" : "dig-grid"}`}>
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
          onCollectionActionStart={(anchorRect) => showTutorialOnce("collection", anchorRect)}
          onToggleCloset={(selection) => {
            toggleCloset(normalizedProduct.id, selection);
          }}
          isInCloset={isInCloset(normalizedProduct.id)}
          onToggleDigbox={() => {
            toggleDigbox(normalizedProduct.id, "home_product_detail");
          }}
          isInDigbox={isInDigbox(normalizedProduct.id)}
          analyticsSource="home_grid"
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
