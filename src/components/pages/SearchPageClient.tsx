"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { KeyboardEvent, SyntheticEvent } from "react";
import dynamic from "next/dynamic";
import {
  ArrowUp,
  ArrowUpRight,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import type { BrandSummary } from "../BrandExplorer";
import { GridView } from "../GridView";
import { DigCategoryFilter } from "../DigCategoryFilter";
import { LegalFooter } from "../LegalFooter";
import { ProgressiveImage } from "../ProgressiveImage";
import type { TutorialAnchorRect, TutorialId } from "../OnboardingTutorial";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { useLocaleContext } from "../../contexts/LocaleContext";
import { useProductsContext } from "../../contexts/ProductsContext";
import { useSearchContext } from "../../contexts/SearchContext";
import { useGridState } from "../../hooks/useGridState";
import {
  prefetchProductDetail,
  useProductDetail,
} from "../../hooks/useProductDetail";
import { useProductModalQuery } from "../../hooks/useProductModalQuery";
import { toPublicUrl } from "../../utils/product";
import { captureEvent } from "../../utils/analytics";
import type { Product } from "../../types";
import { loadProductDetailModal } from "../productDetailModalLoader";
import { authenticatedFetch } from "../../api/shared";
import { searchCatalogProducts } from "../../api";
import { getProductPageUrl } from "../../utils/product";
import type { AgentMessage } from "../../types/fashion-agent";

const BrandExplorer = dynamic(
  () => import("../BrandExplorer").then((module) => module.BrandExplorer),
  { ssr: false }
);
const ProductDetailModal = dynamic(loadProductDetailModal, { ssr: false });
const ImageViewerOverlay = dynamic(
  () =>
    import("../ImageViewerOverlay").then((module) => module.ImageViewerOverlay),
  { ssr: false }
);
const OnboardingTutorial = dynamic(
  () =>
    import("../OnboardingTutorial").then((module) => module.OnboardingTutorial),
  { ssr: false }
);

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

const normalizeBrandKey = (brand: string) =>
  brand.trim().replace(/\s+/g, " ").toLocaleLowerCase();

const getRequestedTutorialId = (value: string | null): TutorialId | null => {
  if (!value) return null;
  return TUTORIAL_IDS.includes(value as TutorialId)
    ? (value as TutorialId)
    : null;
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
      <span className="text-gray-400">
        {text.slice(idx, idx + query.length)}
      </span>
      {idx + query.length < text.length && (
        <span className="font-bold text-white">
          {text.slice(idx + query.length)}
        </span>
      )}
    </>
  );
}

export function SearchPageClient() {
  const { t, locale } = useLocaleContext();
  const {
    products,
    isProductsLoading,
    productsError,
    retryProductsLoad,
    hasMoreProducts,
    isLoadingMoreProducts,
    loadMoreProducts,
  } = useProductsContext();
  const { authUser, isAuthLoading } = useAuthContext();
  const {
    toggleCloset,
    isInCloset,
    ensureLoaded: ensureClosetLoaded,
  } = useClosetContext();
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
    query,
    searchContainerRef,
    setShowSuggestions,
    showSuggestions,
    suggestions,
    brandSuggestions: searchBrandSuggestions,
  } = useSearchContext();
  const grid = useGridState(products);
  const productModal = useProductModalQuery();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [isDetailImageZoomed, setIsDetailImageZoomed] = useState(false);
  const [brandFilter, setBrandFilter] = useState("");
  const [searchMode, setSearchMode] = useState<"product" | "agent">("product");
  const [agentLoginPrompt, setAgentLoginPrompt] = useState(false);
  const [agentSearch, setAgentSearch] = useState<{
    query: string;
    conversationId: string;
    answer: AgentMessage;
  } | null>(null);
  const [agentSearchPending, setAgentSearchPending] = useState(false);
  const [agentSearchError, setAgentSearchError] = useState(false);
  const [catalogSearchResult, setCatalogSearchResult] = useState<{
    query: string;
    products: Product[];
  } | null>(null);
  const [catalogSearchPending, setCatalogSearchPending] = useState(false);
  const [catalogSearchError, setCatalogSearchError] = useState(false);
  const catalogSearchRequest = useRef(0);
  const [isBrandExplorerOpen, setIsBrandExplorerOpen] = useState(false);
  const [showGuestDetailSaveHint, setShowGuestDetailSaveHint] = useState(false);
  const [isScrollTopVisible, setIsScrollTopVisible] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<{
    id: TutorialId;
    anchorRect?: TutorialAnchorRect;
  } | null>(null);
  const gridModalRef = useRef<HTMLDivElement>(null);
  const hasShownGuestDetailSaveHint = useRef(false);
  const detailedProduct = useProductDetail(
    productModal.productId,
    selectedProduct
  );

  useEffect(() => {
    ensureClosetLoaded();
    ensureDigboxLoaded();
  }, [ensureClosetLoaded, ensureDigboxLoaded]);

  useEffect(() => {
    const updateScrollTopVisibility = () =>
      setIsScrollTopVisible(window.scrollY > 160);

    updateScrollTopVisibility();
    window.addEventListener("scroll", updateScrollTopVisibility, {
      passive: true,
    });
    return () =>
      window.removeEventListener("scroll", updateScrollTopVisibility);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("focusSearch") !== "1") return;

    const timer = window.setTimeout(() => {
      const input = document.getElementById(
        "main-product-search"
      ) as HTMLInputElement | null;
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
      input?.focus();

      params.delete("focusSearch");
      const nextQuery = params.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`
      );
    }, 150);

    return () => window.clearTimeout(timer);
  }, []);

  const normalizedProduct = useMemo<Product | null>(() => {
    if (!detailedProduct) return null;
    const imagePath = String(detailedProduct.imagePath || "").trim();
    const image = imagePath ? toPublicUrl(imagePath) : detailedProduct.image;
    const thumbnailImage = imagePath
      ? toPublicUrl(imagePath, { width: 320, height: 320, quality: 65 })
      : detailedProduct.thumbnailImage;
    return { ...detailedProduct, image, thumbnailImage };
  }, [detailedProduct]);

  const brandFilteredProducts = useMemo(
    () =>
      brandFilter
        ? grid.filteredGridProducts.filter(
            (product) =>
              normalizeBrandKey(product.brand) ===
              normalizeBrandKey(brandFilter)
          )
        : grid.filteredGridProducts,
    [brandFilter, grid.filteredGridProducts]
  );

  const submittedCatalogProducts =
    catalogSearchResult?.query === grid.gridSearchQuery
      ? catalogSearchResult.products
      : null;
  const visibleCatalogProducts = submittedCatalogProducts
    ? submittedCatalogProducts.filter(
        (product) =>
          (!grid.gridCategoryFilter ||
            product.category === grid.gridCategoryFilter) &&
          (!grid.gridSubCategoryFilter ||
            product.subCategory === grid.gridSubCategoryFilter) &&
          (!brandFilter ||
            normalizeBrandKey(product.brand) === normalizeBrandKey(brandFilter))
      )
    : brandFilteredProducts;
  const catalogZero = Boolean(
    grid.gridSearchQuery &&
    submittedCatalogProducts &&
    submittedCatalogProducts.length === 0
  );

  const brandSummaries = useMemo<BrandSummary[]>(() => {
    const summaries = new Map<string, BrandSummary>();
    for (const product of products) {
      const name = product.brand.trim().replace(/\s+/g, " ");
      if (!name) continue;
      const key = normalizeBrandKey(name);
      const createdAt =
        product.createdAt && Number.isFinite(Date.parse(product.createdAt))
          ? product.createdAt
          : null;
      const current = summaries.get(key);
      const currentTime = current?.latestCreatedAt
        ? Date.parse(current.latestCreatedAt)
        : 0;
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
    const matched = new Map<string, string>();
    // Server results cover brands outside the currently loaded catalog page.
    for (const item of searchBrandSuggestions) {
      const name = item.brand.trim();
      if (name) matched.set(normalizeBrandKey(name), name);
    }
    for (const brand of brandSummaries) {
      if (normalizeBrandKey(brand.name).includes(normalizedQuery)) {
        matched.set(normalizeBrandKey(brand.name), brand.name);
      }
    }
    return Array.from(matched.values());
  }, [brandSummaries, query, searchBrandSuggestions]);

  const brandCountByName = useMemo(
    () =>
      new Map([
        ...brandSummaries.map(
          (brand) => [brand.name, brand.itemCount] as const
        ),
        ...searchBrandSuggestions.map(
          (brand) => [brand.brand, brand.count] as const
        ),
      ]),
    [brandSummaries, searchBrandSuggestions]
  );

  const recentBrandOptions = useMemo(
    () =>
      brandSummaries
        .slice(0, 6)
        .map(({ name: brand, itemCount: count }) => ({ brand, count })),
    [brandSummaries]
  );

  useEffect(() => {
    if (!productModal.productId) {
      setSelectedProduct(null);
      setActiveRowIndex(null);
      setIsDetailImageZoomed(false);
      return;
    }

    const product = products.find((item) => item.id === productModal.productId);
    if (product) setSelectedProduct(product);
  }, [productModal.productId, products]);

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

  const showTutorialOnce = (
    tutorialId: TutorialId,
    anchorRect?: TutorialAnchorRect
  ) => {
    const storageKey = `sizepicker:tutorial:v2:${tutorialId}`;
    if (window.localStorage.getItem(storageKey)) return;
    window.localStorage.setItem(storageKey, "true");
    setActiveTutorial({ id: tutorialId, anchorRect });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTutorial = getRequestedTutorialId(params.get("tutorial"));
    const shouldResetTutorials =
      params.get("tutorial") === "reset" ||
      params.get("resetTutorials") === "1";

    if (shouldResetTutorials || requestedTutorial) {
      resetTutorialStorage(requestedTutorial ?? undefined);
    }

    if (!requestedTutorial) return;

    const timer = window.setTimeout(() => {
      const rect =
        requestedTutorial === "search"
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
    catalogSearchRequest.current += 1;
    setCatalogSearchResult(null);
    setCatalogSearchPending(false);
    setCatalogSearchError(false);
    setSearchMode("product");
    setAgentLoginPrompt(false);
    setAgentSearch(null);
    const anchorRect = searchContainerRef.current
      ? getAnchorRect(searchContainerRef.current)
      : undefined;
    showTutorialOnce("filters", anchorRect);
    setBrandFilter(brand);
    grid.setGridSearchQuery("");
    setShowSuggestions(false);
    setIsBrandExplorerOpen(false);
    clearQuery();
    captureEvent("catalog_filter_applied", {
      filter_type: "brand",
      result_count: products.filter(
        (product) =>
          normalizeBrandKey(product.brand) === normalizeBrandKey(brand)
      ).length,
    });
  };

  const handleClearBrand = () => {
    setBrandFilter("");
    setIsBrandExplorerOpen(false);
    captureEvent("catalog_filter_cleared", { filter_type: "brand" });
  };

  const handleCategoryFilterChange = (
    value: string,
    anchorRect?: TutorialAnchorRect
  ) => {
    showTutorialOnce("filters", anchorRect);
    grid.setGridCategoryFilter(value);
    grid.setGridSubCategoryFilter("");
    captureEvent("catalog_filter_applied", {
      filter_type: "category",
      filter_value: value || "all",
    });
  };

  const searchWithAgent = async (term: string) => {
    if (!authUser || agentSearchPending) return;
    setAgentSearch(null);
    setAgentSearchError(false);
    setAgentSearchPending(true);
    setShowSuggestions(false);
    const conversationId = crypto.randomUUID();
    try {
      const response = await authenticatedFetch("/api/fashion-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          requestId: crypto.randomUUID(),
          message: term,
          locale,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok || !Array.isArray(payload.data?.messages))
        throw new Error("agent_search_failed");
      const answer = payload.data.messages.find(
        (item: AgentMessage) => item.role === "assistant"
      ) as AgentMessage | undefined;
      if (!answer) throw new Error("agent_search_failed");
      setAgentSearch({ query: term, conversationId, answer });
      captureEvent("catalog_agent_search_submitted", {
        query_length: term.length,
        result_count: answer.products?.length || 0,
      });
    } catch {
      setAgentSearchError(true);
    } finally {
      setAgentSearchPending(false);
    }
  };

  const submitAgentSearch = (term: string) => {
    if (!term) return;
    if (!authUser) {
      setAgentLoginPrompt(true);
      setAgentSearch(null);
      setShowSuggestions(false);
      return;
    }
    setAgentLoginPrompt(false);
    grid.setGridSearchQuery("");
    void searchWithAgent(term);
  };

  const submitCatalogSearch = async (term: string) => {
    const request = ++catalogSearchRequest.current;
    setCatalogSearchResult(null);
    setCatalogSearchPending(true);
    setCatalogSearchError(false);
    setAgentLoginPrompt(false);
    setAgentSearch(null);
    setShowSuggestions(false);
    grid.setGridSearchQuery(term);
    try {
      const results = await searchCatalogProducts(term);
      if (request !== catalogSearchRequest.current) return;
      setCatalogSearchResult({ query: term, products: results });
      captureEvent("catalog_search_submitted", {
        query_length: term.length,
        result_count: results.length,
      });
    } catch {
      if (request === catalogSearchRequest.current) setCatalogSearchError(true);
    } finally {
      if (request === catalogSearchRequest.current)
        setCatalogSearchPending(false);
    }
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    const exactBrand = brandSummaries.find(
      (brand) => normalizeBrandKey(brand.name) === normalizeBrandKey(term)
    );
    // Catalog brands commonly include both English and Korean names, e.g.
    // "AFTERPRAY(애프터프레이)". If the submitted Korean/English alias maps
    // to one brand suggestion, treat it as the same explicit brand selection.
    const selectedBrand =
      exactBrand?.name ??
      (brandSuggestions.length === 1 ? brandSuggestions[0] : undefined);

    // A brand submitted from the keyboard should behave exactly like choosing
    // that brand from the discovery list: keep the brand heading and clear
    // action rather than showing a generic keyword result.
    if (selectedBrand && searchMode === "product") {
      handleBrandSelect(selectedBrand);
      return;
    }

    if (searchMode === "agent") {
      submitAgentSearch(term);
      return;
    }

    void submitCatalogSearch(term);
  };

  const handleProductClick = (
    product: Product,
    anchorRect?: TutorialAnchorRect
  ) => {
    if (
      !isAuthLoading &&
      !authUser &&
      isGuestHydrated &&
      guestCount === 0 &&
      !hasShownGuestDetailSaveHint.current
    ) {
      hasShownGuestDetailSaveHint.current = true;
      setShowGuestDetailSaveHint(true);
    }
    setSelectedProduct(product);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
    showTutorialOnce("detail", anchorRect);
    productModal.openProduct(product.id);
    captureEvent("catalog_product_opened", {
      product_id: product.id,
      category: product.category,
      ui_surface: "catalog_grid",
    });
  };

  const handleGridClose = () => {
    productModal.closeProduct();
    setSelectedProduct(null);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
    setShowGuestDetailSaveHint(false);
  };

  const handleGridRecommendationClick = (
    product: Product,
    anchorRect?: TutorialAnchorRect
  ) => {
    setSelectedProduct(product);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
    showTutorialOnce("detail", anchorRect);
    productModal.openProduct(product.id, true);
    captureEvent("catalog_product_opened", {
      product_id: product.id,
      category: product.category,
      ui_surface: "catalog_recommendation",
    });
  };

  const handleImageLoadError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.style.display = "none";
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--app-main-pt)] text-white lg:pt-24">
      {productsError && (
        <div className="mb-6 flex w-full max-w-4xl flex-col items-center gap-4 rounded-xl border border-orange-500 bg-orange-900/50 px-6 py-4 text-orange-200 md:flex-row">
          <div className="flex flex-1 items-center gap-2">
            <ShieldAlert className="h-6 w-6 flex-shrink-0" />
            <span className="text-sm font-medium md:text-base">
              {productsError}
            </span>
          </div>
          <button
            onClick={retryProductsLoad}
            className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-orange-800 px-4 py-2 text-sm font-bold transition hover:bg-orange-700"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      )}

      {/* One entry point for catalog lookup and natural-language exploration. */}
      <div className="mb-3 w-full max-w-3xl">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            aria-pressed={searchMode === "product"}
            onClick={() => {
              setSearchMode("product");
              setAgentLoginPrompt(false);
              setShowSuggestions(false);
            }}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 font-semibold transition ${searchMode === "product" ? "border-orange-400/60 bg-orange-500/15 text-orange-200" : "border-white/15 text-gray-400 hover:text-white"}`}
          >
            <Search className="h-3.5 w-3.5" />
            {locale === "en" ? "Product search" : "상품 검색"}
          </button>
          <button
            type="button"
            aria-pressed={searchMode === "agent"}
            onClick={() => {
              setSearchMode("agent");
              document.getElementById("main-product-search")?.focus();
              setShowSuggestions(true);
            }}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 font-semibold transition ${searchMode === "agent" ? "border-orange-400/60 bg-orange-500/15 text-orange-200" : "border-white/15 text-gray-400 hover:text-white"}`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {locale === "en" ? "Ask AI" : "AI에게 질문"}
          </button>
        </div>
        <div className="relative" ref={searchContainerRef}>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search
              className={`h-5 w-5 transition-colors ${showSuggestions ? "text-orange-500" : "text-gray-500"}`}
            />
          </div>
          <input
            id="main-product-search"
            type="text"
            className={`h-14 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-12 ${searchMode === "agent" ? "pr-20" : "pr-10"} text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_32px_rgba(0,0,0,0.24)] outline-none transition placeholder:text-gray-600 focus:border-orange-500/60 focus:bg-white/[0.08] focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_3px_rgba(249,115,22,0.12)]`}
            placeholder={
              searchMode === "agent"
                ? locale === "en"
                  ? "Ask about products or your saved items"
                  : "상품이나 내 옷에 대해 편하게 질문해보세요"
                : t("search.placeholder")
            }
            value={query}
            onChange={(e) => {
              catalogSearchRequest.current += 1;
              setCatalogSearchResult(null);
              setCatalogSearchPending(false);
              setCatalogSearchError(false);
              grid.setGridSearchQuery("");
              handleQueryChange(e.target.value);
              if (searchMode === "agent") setShowSuggestions(false);
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
                catalogSearchRequest.current += 1;
                setCatalogSearchResult(null);
                setCatalogSearchPending(false);
                setCatalogSearchError(false);
                grid.setGridSearchQuery("");
                clearQuery();
              }}
              className={`absolute inset-y-0 ${searchMode === "agent" ? "right-10" : "right-0"} flex w-11 items-center justify-center border-none bg-transparent p-0 text-gray-400 outline-none transition hover:text-white`}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {searchMode === "agent" && (
            <button
              type="button"
              onClick={() => submitAgentSearch(query.trim())}
              disabled={!query.trim() || agentSearchPending}
              aria-label={locale === "en" ? "Ask AI" : "AI에게 질문 보내기"}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-orange-300 disabled:text-gray-600"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          )}

          {showSuggestions && searchMode === "agent" && (
            <div className="search-discovery-popover ui-floating-surface absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-white/[0.12] bg-[#111114]/95 p-2 shadow-[0_20px_48px_rgba(0,0,0,0.42)]">
              <p className="px-3 pb-1 pt-2 text-xs font-semibold text-gray-400">
                {locale === "en" ? "Try asking" : "이렇게 물어보세요"}
              </p>
              {(locale === "en"
                ? [
                    "Shoes to match my saved pants",
                    "What do the clothes I own have in common?",
                    "Recommend a minimal black jacket",
                    "Which outerwear in my closet suits my taste?",
                    "What style do my saved products share?",
                  ]
                : [
                    "저장한 바지와 어울리는 신발 추천해줘",
                    "내가 가진 옷들의 공통점은 뭐야?",
                    "미니멀한 검정 아우터 추천해줘",
                    "내 옷장에 있는 아우터 중 추천해줘",
                    "저장한 상품에서는 어떤 취향이 보여?",
                  ]
              ).map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    handleQueryChange(example);
                    document.getElementById("main-product-search")?.focus();
                    setShowSuggestions(false);
                  }}
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-gray-200 transition hover:bg-white/[0.07] hover:text-orange-200"
                >
                  {example}
                </button>
              ))}
            </div>
          )}

          {showSuggestions && searchMode === "product" && (
            <div className="search-discovery-popover ui-floating-surface absolute left-0 right-0 top-full z-20 mt-2 max-h-[420px] origin-top overflow-hidden overflow-y-auto rounded-2xl border border-white/[0.12] bg-[#111114]/95 shadow-[0_20px_48px_rgba(0,0,0,0.42)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {!query ? (
                brandSummaries.length > 0 ? (
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between gap-3 px-0.5">
                      <div className="text-xs font-semibold text-gray-300">
                        {t("search.recentBrands")}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsBrandExplorerOpen(true);
                          setShowSuggestions(false);
                        }}
                        className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-semibold text-gray-400 transition-[color,background-color,transform] hover:bg-white/[0.06] hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80"
                      >
                        {t("search.viewAll")}{" "}
                        <ArrowUpRight className="h-3.5 w-3.5" />
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
                          <span className="w-full truncate text-xs font-bold text-gray-200">
                            {brand}
                          </span>
                          <span className="mt-1 text-[11px] font-medium text-gray-500">
                            {t("search.registeredProducts", { count })}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-sm font-semibold text-gray-300">
                      {t("search.noBrands")}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {t("search.noBrandsHelp")}
                    </p>
                  </div>
                )
              ) : brandSuggestions.length > 0 || suggestions.length > 0 ? (
                <>
                  {brandSuggestions.length > 0 && (
                    <>
                      <div className="px-5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        {t("search.brands")}
                      </div>
                      <ul>
                        {brandSuggestions.map((brand) => (
                          <li
                            key={brand}
                            className="border-b border-white/10 last:border-0"
                          >
                            <button
                              type="button"
                              onClick={() => handleBrandSelect(brand)}
                              className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-[background-color,color] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400/80"
                            >
                              <span className="flex min-w-0 items-center gap-3">
                                <Search className="h-4 w-4 flex-shrink-0 text-gray-500" />
                                <span className="truncate text-sm">
                                  <HighlightMatch text={brand} query={query} />
                                </span>
                              </span>
                              <span className="text-xs font-bold text-gray-500">
                                {brandCountByName.get(brand) ?? 0}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {suggestions.length > 0 && (
                    <>
                      {brandSuggestions.length > 0 && (
                        <div className="border-t border-white/10" />
                      )}
                      <div className="px-5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        {t("search.productHeading")}
                      </div>
                      <ul>
                        {suggestions.map((item) => (
                          <li
                            key={item.id}
                            className="border-b border-white/10 last:border-0"
                          >
                            <button
                              type="button"
                              onClick={(event) => {
                                handleProductClick(
                                  item,
                                  getAnchorRect(event.currentTarget)
                                );
                                setShowSuggestions(false);
                              }}
                              className="flex w-full items-center gap-4 px-5 py-4 text-left transition-[background-color,color] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400/80"
                            >
                              <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-white/10">
                                <ProgressiveImage
                                  src={item.thumbnailImage || item.image}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  fetchPriority="low"
                                  onError={handleImageLoadError}
                                />
                              </div>
                              <div>
                                <div className="font-medium">
                                  <HighlightMatch
                                    text={item.name}
                                    query={query}
                                  />
                                </div>
                                <div className="text-sm text-gray-400">
                                  {item.brand} · {item.category}
                                </div>
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
                  {t("search.noSuggestions")}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {agentLoginPrompt && (
        <div className="mb-5 w-full max-w-3xl rounded-xl border border-orange-400/25 bg-orange-500/[0.08] px-4 py-3 text-sm text-gray-200">
          {locale === "en"
            ? "Sign in to explore your collection with AI."
            : "AI 탐색은 로그인 후 이용할 수 있어요."}{" "}
          <Link
            href="/login?returnTo=%2F"
            className="font-semibold text-orange-300 underline underline-offset-2"
          >
            {locale === "en" ? "Sign in" : "로그인"}
          </Link>
        </div>
      )}

      {(agentSearchPending || agentSearchError || agentSearch) && (
        <section className="mb-6 w-full max-w-7xl" aria-live="polite">
          {agentSearchPending && (
            <p className="py-8 text-center text-sm text-gray-400">
              {locale === "en"
                ? "Finding products…"
                : "조건에 맞는 상품을 찾고 있어요…"}
            </p>
          )}
          {agentSearchError && (
            <p className="py-8 text-center text-sm text-orange-300">
              {locale === "en"
                ? "Could not search right now. Please try again."
                : "지금은 상품을 찾지 못했어요. 다시 시도해 주세요."}
            </p>
          )}
          {agentSearch && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-400">{agentSearch.query}</p>
                  <h2 className="mt-1 text-lg font-bold">
                    {locale === "en" ? "Products for your search" : "탐색 결과"}
                  </h2>
                </div>
                <Link
                  href={`/fashion-agent?conversationId=${encodeURIComponent(agentSearch.conversationId)}`}
                  className="rounded-xl border border-orange-400/40 px-4 py-2 text-sm font-semibold text-orange-300 hover:bg-orange-400/10"
                >
                  {locale === "en" ? "Ask a follow-up" : "추가 질문하기"}{" "}
                  <ArrowUpRight className="ml-1 inline h-4 w-4" />
                </Link>
              </div>
              <p className="mb-5 whitespace-pre-line text-sm leading-6 text-gray-300">
                {agentSearch.answer.text}
              </p>
              {!!agentSearch.answer.products?.length && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {agentSearch.answer.products.map((product) => (
                    <Link
                      key={product.id}
                      href={getProductPageUrl(product)}
                      className="overflow-hidden rounded-xl border border-white/10 bg-black/30 hover:border-orange-400/50"
                    >
                      <div className="relative aspect-square overflow-hidden bg-white/5">
                        {product.image && (
                          <ProgressiveImage
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="truncate text-xs text-gray-400">
                          {product.brand}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm font-semibold">
                          {product.name}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {!agentSearch && !agentSearchPending && (
        <DigCategoryFilter
          category={grid.gridCategoryFilter}
          subCategory={grid.gridSubCategoryFilter}
          onCategoryChange={(value) => handleCategoryFilterChange(value)}
          onSubCategoryChange={grid.setGridSubCategoryFilter}
        />
      )}

      {!agentSearch && !agentSearchPending && (
        <div className="w-full max-w-7xl dig-grid">
          {catalogSearchPending && (
            <p
              className="py-16 text-center text-sm text-gray-400"
              role="status"
            >
              {locale === "en"
                ? "Searching products…"
                : "상품을 검색하고 있어요…"}
            </p>
          )}
          {catalogSearchError && (
            <p
              className="py-16 text-center text-sm text-orange-300"
              role="alert"
            >
              {locale === "en"
                ? "Product search failed. Please try again."
                : "상품 검색에 실패했어요. 다시 시도해 주세요."}
            </p>
          )}
          {catalogZero && !catalogSearchPending && !catalogSearchError && (
            <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-white/10 bg-white/[0.035] px-6 py-12 text-center">
              <p className="text-base font-semibold text-white">
                {locale === "en"
                  ? "No product name matches found."
                  : "상품명 검색 결과가 없어요."}
              </p>
              <p className="mt-2 text-sm text-gray-400">
                {locale === "en"
                  ? "Want the DIGBOX agent to search by your conditions?"
                  : "DIGBOX 에이전트에게 조건으로 찾아볼까요?"}
              </p>
              <button
                type="button"
                onClick={() => submitAgentSearch(grid.gridSearchQuery)}
                disabled={agentSearchPending}
                className="mt-5 min-h-11 rounded-xl bg-orange-500 px-5 text-sm font-bold text-black transition hover:bg-orange-400 disabled:opacity-50"
              >
                {locale === "en"
                  ? "Search with these conditions"
                  : "이 조건으로 찾아보기"}
              </button>
            </div>
          )}
          {brandFilter && (
            <div className="mb-4 flex items-center justify-between gap-3 px-0.5 text-sm sm:text-base">
              <p className="min-w-0 truncate font-semibold text-white">
                <span className="text-orange-300">{brandFilter}</span>
                {t("search.productCountSuffix", {
                  count: brandFilteredProducts.length,
                })}
              </p>
              <button
                type="button"
                onClick={handleClearBrand}
                className="flex h-9 flex-shrink-0 items-center rounded-xl border border-white/[0.12] bg-white/[0.055] px-3 text-xs font-bold text-gray-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition duration-[var(--duration-popover)] hover:-translate-y-px hover:border-orange-300/45 hover:bg-orange-500/[0.11] hover:text-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11131a]"
              >
                {t("search.clearSelection")}
              </button>
            </div>
          )}
          {!catalogSearchPending && !catalogSearchError && !catalogZero && (
            <GridView
              allProducts={submittedCatalogProducts ?? products}
              filteredGridProducts={visibleCatalogProducts}
              gridCategoryCounts={grid.gridCategoryCounts}
              gridCategoryFilter={grid.gridCategoryFilter}
              setGridCategoryFilter={grid.setGridCategoryFilter}
              gridSearchQuery={grid.gridSearchQuery}
              setGridSearchQuery={grid.setGridSearchQuery}
              isInteractionDisabled={showSuggestions}
              onProductClick={handleProductClick}
              onProductPrefetch={(product) => prefetchProductDetail(product.id)}
              onImageError={handleImageLoadError}
              isLoading={isProductsLoading}
              hasMoreProducts={!submittedCatalogProducts && hasMoreProducts}
              isLoadingMoreProducts={isLoadingMoreProducts}
              onLoadMoreProducts={() => {
                captureEvent("catalog_load_more_requested", {
                  current_count: products.length,
                });
                void loadMoreProducts();
              }}
            />
          )}
        </div>
      )}

      <LegalFooter />

      {isScrollTopVisible && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label={t("search.backToTop")}
          title={t("search.backToTop")}
          className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/[0.1] text-white shadow-[0_12px_32px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-xl transition duration-[var(--duration-popover)] hover:-translate-y-0.5 hover:border-orange-300/55 hover:bg-white/[0.16] hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11131a] md:bottom-7 md:right-7"
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
          onCollectionActionStart={(anchorRect) =>
            showTutorialOnce("collection", anchorRect)
          }
          onToggleCloset={(selection) => {
            toggleCloset(normalizedProduct.id, selection);
          }}
          isInCloset={isInCloset(normalizedProduct.id)}
          onToggleDigbox={() => {
            setShowGuestDetailSaveHint(false);
            toggleDigbox(normalizedProduct.id, "home_product_detail");
          }}
          isInDigbox={isInDigbox(normalizedProduct.id)}
          showGuestDigboxHint={showGuestDetailSaveHint}
          analyticsSource="home_grid"
        />
      )}

      {normalizedProduct && (
        <ImageViewerOverlay
          open={isDetailImageZoomed}
          src={normalizedProduct.image}
          alt={normalizedProduct.name}
          onClose={() => setIsDetailImageZoomed(false)}
        />
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
