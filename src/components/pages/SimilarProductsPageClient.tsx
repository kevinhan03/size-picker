"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, SyntheticEvent } from "react";
import dynamic from "next/dynamic";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProgressiveImage } from "../ProgressiveImage";
import type { Product } from "../../types";
import { toPublicUrl } from "../../utils/product";
import { useLocaleContext } from "../../contexts/LocaleContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { prefetchProductDetail, useProductDetail } from "../../hooks/useProductDetail";
import { useProductModalQuery } from "../../hooks/useProductModalQuery";
import { captureEvent } from "../../utils/analytics";
import { loadProductDetailModal } from "../productDetailModalLoader";
type BehavioralStatus = "idle" | "loading" | "ready" | "error";
type RecommendationSection = "similar" | "style" | "behavioral";

const ProductDetailModal = dynamic(loadProductDetailModal, { ssr: false });
const ImageViewerOverlay = dynamic(() => import("../ImageViewerOverlay").then((module) => module.ImageViewerOverlay), { ssr: false });

const RECOMMENDATION_SECTIONS: Array<{ id: RecommendationSection }> = [
  { id: "similar" },
  { id: "style" },
  { id: "behavioral" },
];

function parseNumericId(param: string): string {
  return param.match(/^\d+/)?.[0] ?? param;
}

function normalizeProductImages(product: Product): Product {
  const imagePath = String(product.imagePath || "").trim();
  if (!imagePath) return product;
  return {
    ...product,
    image: toPublicUrl(imagePath),
    thumbnailImage: toPublicUrl(imagePath, { width: 320, height: 320, quality: 65 }),
  };
}

function ProductCard({ product, onImageLoadError, onOpenProduct, tab, sourceProductId, position }: { product: Product; onImageLoadError: (event: SyntheticEvent<HTMLImageElement>) => void; onOpenProduct: (product: Product) => void; tab: RecommendationSection; sourceProductId: string; position: number }) {
  const { t } = useLocaleContext();
  const productAnalysisStatus = product.categoryAnalysisStatus === "pending"
    ? { label: t("similar.analysis.categoryPending"), className: "border-sky-400/25 bg-sky-400/10 text-sky-200" }
    : product.categoryAnalysisStatus === "failed"
      ? { label: t("similar.analysis.categoryFailed"), className: "border-amber-400/25 bg-amber-400/10 text-amber-200" }
      : product.styleAxisAnalysisStatus === "pending" || product.styleAxisAnalysisStatus === "tagging"
        ? { label: t("similar.analysis.stylePending"), className: "border-violet-400/25 bg-violet-400/10 text-violet-200" }
        : product.styleAxisAnalysisStatus === "failed"
          ? { label: t("similar.analysis.styleFailed"), className: "border-red-400/25 bg-red-400/10 text-red-200" }
          : product.styleAxisAnalysisStatus === "tagged"
            ? { label: t("similar.analysis.styleComplete"), className: "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200" }
            : null;
  return (
    <button type="button" onClick={() => { captureEvent("recommendation_clicked", { source_product_id: sourceProductId, candidate_product_id: product.id, recommendation_tab: tab, recommendation_position: position, algorithm_version: "recommendations-v10" }); onOpenProduct(product); }} onPointerEnter={() => prefetchProductDetail(product.id)} onPointerDown={() => prefetchProductDetail(product.id)} onFocus={() => prefetchProductDetail(product.id)} className="ui-product-card ui-card-lift relative flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] border border-white/[0.09] bg-[linear-gradient(180deg,rgba(25,25,29,0.98),rgba(15,15,18,0.98))] text-left shadow-[0_14px_34px_rgba(0,0,0,0.18)] transition-transform duration-150 [transition-timing-function:var(--ease-out)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f5f5f5]">
        <ProgressiveImage src={product.image} thumbnailSrc={product.thumbnailImage} alt={product.name} className="object-contain" loading="lazy" onError={onImageLoadError} />
      </div>
      <div className="flex flex-1 flex-col bg-black/[0.06] px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
        <div className="mb-1 flex min-w-0 items-center gap-2">
          <div className="truncate text-xs font-bold tracking-wide text-orange-500">{product.brand}</div>
          {product.isInstagram && <span className="flex-shrink-0 rounded-md border border-orange-500/35 bg-orange-500/[0.12] px-1.5 py-0.5 text-[9px] font-black leading-none text-orange-300">PICK</span>}
        </div>
        <h3 className="mb-2 line-clamp-2 text-[0.95rem] font-bold leading-tight text-white sm:text-lg">{product.name}</h3>
        <div className="mt-auto pt-2 text-center text-sm text-gray-300">{product.category}</div>
        {productAnalysisStatus ? <span className={`mx-auto mt-2 inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold ${productAnalysisStatus.className}`}>{productAnalysisStatus.label}</span> : null}
      </div>
    </button>
  );
}

function EmptyRecommendationState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 px-6 text-center">
      <h4 className="text-sm font-semibold text-gray-300">{title}</h4>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-500">{description}</p>
    </div>
  );
}

function EmptyBehavioralCard({ status }: { status: BehavioralStatus }) {
  const { t } = useLocaleContext();
  const content = status === "loading"
    ? { title: t("similar.behavioral.loading.title"), description: t("similar.behavioral.loading.description") }
    : status === "error"
      ? { title: t("similar.behavioral.error.title"), description: t("similar.behavioral.error.description") }
      : { title: t("similar.behavioral.empty.title"), description: t("similar.behavioral.empty.description") };
  return <EmptyRecommendationState {...content} />;
}

type InitialRecommendationData = { sourceProduct: Product | null; similarProducts: Product[]; styleProducts: Product[] } | null;

export function SimilarProductsPageClient({ id, initialData = null }: { id: string; initialData?: InitialRecommendationData }) {
  const router = useRouter();
  const { t } = useLocaleContext();
  const { closetProducts, toggleCloset, isInCloset, ensureLoaded: ensureClosetLoaded } = useClosetContext();
  const { toggleDigbox, isInDigbox, ensureLoaded: ensureDigboxLoaded } = useDigboxContext();
  const productModal = useProductModalQuery();
  const [sourceProduct, setSourceProduct] = useState<Product | null>(initialData?.sourceProduct || null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>(initialData?.similarProducts || []);
  const [styleProducts, setStyleProducts] = useState<Product[]>(initialData?.styleProducts || []);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(!initialData);
  const [behavioralProducts, setBehavioralProducts] = useState<Product[]>([]);
  const [behavioralStatus, setBehavioralStatus] = useState<BehavioralStatus>("idle");
  const [activeSection, setActiveSection] = useState<RecommendationSection>("similar");
  const [behavioralRequestedForId, setBehavioralRequestedForId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [isDetailImageZoomed, setIsDetailImageZoomed] = useState(false);
  const numericId = parseNumericId(id);
  const impressionKeys = useRef(new Set<string>());
  const modalRef = useRef<HTMLDivElement>(null);
  const detailedProduct = useProductDetail(productModal.productId, selectedProduct);

  useEffect(() => {
    ensureClosetLoaded();
    ensureDigboxLoaded();
  }, [ensureClosetLoaded, ensureDigboxLoaded]);

  useEffect(() => {
    if (initialData?.sourceProduct) return;
    const controller = new AbortController();
    setIsRecommendationsLoading(true);
    fetch(`/api/products/${encodeURIComponent(numericId)}/recommendations`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("recommendations request failed");
        const payload = await response.json();
        if (!payload?.ok || !payload?.data?.sourceProduct) throw new Error("invalid recommendations response");
        setSourceProduct(normalizeProductImages(payload.data.sourceProduct));
        setSimilarProducts((payload.data.similarProducts || []).map(normalizeProductImages));
        setStyleProducts((payload.data.styleProducts || []).map(normalizeProductImages));
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSourceProduct(null);
          setSimilarProducts([]);
          setStyleProducts([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsRecommendationsLoading(false);
      });
    return () => controller.abort();
  }, [initialData, numericId]);

  const normalizedSourceProduct = useMemo(
    () => (sourceProduct ? normalizeProductImages(sourceProduct) : null),
    [sourceProduct]
  );

  const normalizedModalProduct = useMemo(
    () => (detailedProduct ? normalizeProductImages(detailedProduct) : null),
    [detailedProduct]
  );

  useEffect(() => {
    if (!productModal.productId) {
      setSelectedProduct(null);
      setActiveRowIndex(null);
      setIsDetailImageZoomed(false);
      return;
    }

    const products = [sourceProduct, ...similarProducts, ...styleProducts, ...behavioralProducts].filter((product): product is Product => product !== null);
    const product = products.find((item) => item.id === productModal.productId);
    if (product) setSelectedProduct(product);
  }, [behavioralProducts, productModal.productId, similarProducts, sourceProduct, styleProducts]);

  useEffect(() => {
    if (!normalizedSourceProduct) return;
    for (const [tab, products] of [["similar", similarProducts], ["style", styleProducts]] as const) {
      if (!products.length) continue;
      const key = `${numericId}:${tab}:${products.map((product) => product.id).join(",")}`;
      if (impressionKeys.current.has(key)) continue;
      impressionKeys.current.add(key);
      captureEvent("recommendation_impression", { source_product_id: numericId, recommendation_tab: tab, candidate_product_ids: products.map((product) => product.id).join(","), candidate_count: products.length, algorithm_version: "recommendations-v10" });
    }
  }, [normalizedSourceProduct, numericId, similarProducts, styleProducts]);

  useEffect(() => {
    if (behavioralRequestedForId === numericId) return;
    setBehavioralProducts([]);
    setBehavioralStatus("idle");
  }, [behavioralRequestedForId, numericId]);

  useEffect(() => {
    if (behavioralRequestedForId !== numericId) return;
    let cancelled = false;
    setBehavioralProducts([]);
    setBehavioralStatus("loading");
    fetch(`/api/products/${encodeURIComponent(numericId)}/behavioral-related`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("behavioral related products request failed");
        const payload = await response.json();
        if (!payload?.ok || !Array.isArray(payload?.data?.products)) throw new Error("invalid behavioral response");
        if (!cancelled) {
          setBehavioralProducts(payload.data.products.map(normalizeProductImages));
          setBehavioralStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setBehavioralStatus("error");
      });
    return () => { cancelled = true; };
  }, [behavioralRequestedForId, numericId]);

  const selectSection = (section: RecommendationSection) => {
    setActiveSection(section);
    if (section === "behavioral" && behavioralRequestedForId !== numericId) {
      setBehavioralStatus("loading");
      setBehavioralRequestedForId(numericId);
    }
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    const nextIndex = (index + direction + RECOMMENDATION_SECTIONS.length) % RECOMMENDATION_SECTIONS.length;
    const nextSection = RECOMMENDATION_SECTIONS[nextIndex];
    selectSection(nextSection.id);
    document.getElementById(`${nextSection.id}-recommendation-tab`)?.focus();
  };

  const handleImageLoadError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.style.display = "none";
  };

  const handleProductOpen = (product: Product, replace = false) => {
    setSelectedProduct(product);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
    productModal.openProduct(product.id, replace);
  };

  const handleModalClose = () => {
    productModal.closeProduct();
    setSelectedProduct(null);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
  };

  const handleSourceProductReturn = () => {
    router.back();
  };

  if (isRecommendationsLoading && !sourceProduct) {
    return <main className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--app-main-pt)] text-white" />;
  }
  if (!normalizedSourceProduct) {
    return <main className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white"><div><p className="text-base font-bold">{t("similar.loadError")}</p><Link href="/" className="mt-4 inline-flex rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-gray-200 transition active:scale-[0.98]">{t("similar.browseProducts")}</Link></div></main>;
  }

  return (
    <main className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--page-header-top)] text-white">
      <div className="mx-auto w-full max-w-7xl">
        <header className="border-b border-white/10 pb-4 sm:pb-6">
          <button
            type="button"
            onClick={handleSourceProductReturn}
            className="group -mx-2 flex min-h-14 w-[calc(100%+1rem)] min-w-0 items-center gap-3 rounded-xl px-2 text-left transition-[background-color,transform] duration-150 hover:bg-white/[0.035] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70"
          >
            <div className="isolate h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/[0.06] p-1" style={{ position: "relative" }}>
              <ProgressiveImage src={normalizedSourceProduct.image} thumbnailSrc={normalizedSourceProduct.thumbnailImage} alt="" className="rounded-md object-contain" loading="eager" onError={handleImageLoadError} />
            </div>
            <div className="min-w-0 flex-1"><p className="text-[11px] font-medium tracking-wide text-gray-500">{t("similar.currentProduct")}</p><p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-gray-100"><span className="text-gray-400">{normalizedSourceProduct.brand}</span><span className="text-gray-600"> · </span>{normalizedSourceProduct.name}</p></div>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-600 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        </header>

        <section className="mt-4 pb-8 sm:mt-[var(--page-header-content-gap)] sm:pb-10" aria-label={t("similar.recommendationsAria")}>
          <div role="tablist" aria-label={t("similar.criteriaAria")} className="grid grid-cols-3 gap-1 border-b border-white/[0.08]">
            {RECOMMENDATION_SECTIONS.map((section, index) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  id={`${section.id}-recommendation-tab`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${section.id}-recommendation-panel`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => selectSection(section.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  className={`outfit-pressable min-h-11 border-b-2 px-1 py-2 text-[13px] font-black tracking-[-0.015em] transition-[border-color,color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 sm:px-4 sm:text-sm ${isActive ? "border-orange-400 text-orange-200" : "border-transparent text-white/45 hover:border-white/[0.24] hover:text-orange-100"}`}
                >
                  {section.id === "similar" ? t("similar.tab.similar") : section.id === "style" ? t("similar.tab.style") : t("similar.tab.behavioral")}
                </button>
              );
            })}
          </div>

          {RECOMMENDATION_SECTIONS.map((section) => {
            if (section.id !== activeSection) return null;
            const productsForSection = section.id === "similar" ? similarProducts : section.id === "style" ? styleProducts : behavioralProducts;
            const isBehavioral = section.id === "behavioral";
            const hasProducts = productsForSection.length > 0;
            const emptyTitle = section.id === "similar" ? t("similar.empty.similar.title") : t("similar.empty.style.title");
            const emptyDescription = section.id === "similar"
              ? t("similar.empty.similar.description")
              : t("similar.empty.style.description");

            return (
              <div key={section.id} id={`${section.id}-recommendation-panel`} role="tabpanel" aria-labelledby={`${section.id}-recommendation-tab`} tabIndex={0} className="pt-4 sm:pt-5">
                {isBehavioral && (!hasProducts || behavioralStatus !== "ready") ? (
                  <EmptyBehavioralCard status={behavioralStatus} />
                ) : hasProducts ? (
                  <div className="grid grid-cols-2 gap-3 pb-2 lg:grid-cols-4 lg:gap-5">{productsForSection.map((product, index) => <ProductCard key={product.id} product={product} tab={section.id} sourceProductId={numericId} position={index + 1} onOpenProduct={handleProductOpen} onImageLoadError={handleImageLoadError} />)}</div>
                ) : (
                  <EmptyRecommendationState title={emptyTitle} description={emptyDescription} />
                )}
              </div>
            );
          })}
        </section>

        {normalizedModalProduct && (
          <ProductDetailModal
            product={normalizedModalProduct}
            closetProduct={closetProducts.find((item) => item.id === normalizedModalProduct.id) || null}
            activeRowIndex={activeRowIndex}
            onClose={handleModalClose}
            onRowClick={(rowIndex) => setActiveRowIndex(rowIndex)}
            onRecommendationClick={(product) => handleProductOpen(product, true)}
            onZoomImage={() => setIsDetailImageZoomed(true)}
            onImageError={handleImageLoadError}
            modalRef={modalRef}
            onToggleCloset={(selection) => toggleCloset(normalizedModalProduct.id, selection)}
            isInCloset={isInCloset(normalizedModalProduct.id)}
            onToggleDigbox={() => toggleDigbox(normalizedModalProduct.id)}
            isInDigbox={isInDigbox(normalizedModalProduct.id)}
          />
        )}
        {normalizedModalProduct && <ImageViewerOverlay open={isDetailImageZoomed} src={normalizedModalProduct.image} alt={normalizedModalProduct.name} onClose={() => setIsDetailImageZoomed(false)} />}
      </div>
    </main>
  );
}
