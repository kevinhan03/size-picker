"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, SyntheticEvent } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "../PageHeader";
import { ProgressiveImage } from "../ProgressiveImage";
import type { Product } from "../../types";
import { getProductPageUrl, toPublicUrl } from "../../utils/product";
import { useLocaleContext } from "../../contexts/LocaleContext";
import { captureEvent } from "../../utils/analytics";
type BehavioralStatus = "idle" | "loading" | "ready" | "error";
type RecommendationSection = "similar" | "style" | "behavioral";

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

function ProductCard({ product, onImageLoadError, tab, sourceProductId, position }: { product: Product; onImageLoadError: (event: SyntheticEvent<HTMLImageElement>) => void; tab: RecommendationSection; sourceProductId: string; position: number }) {
  const href = `${getProductPageUrl(product)}?source=recommendation&recommendation_tab=${encodeURIComponent(tab)}&recommendation_source_product=${encodeURIComponent(sourceProductId)}&recommendation_position=${position}`;
  return (
    <Link href={href} scroll={false} onClick={() => captureEvent("recommendation_clicked", { source_product_id: sourceProductId, candidate_product_id: product.id, recommendation_tab: tab, recommendation_position: position, algorithm_version: "recommendations-v9" })} className="ui-product-card ui-card-lift relative flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-white/[0.09] bg-[linear-gradient(180deg,rgba(25,25,29,0.98),rgba(15,15,18,0.98))] shadow-[0_14px_34px_rgba(0,0,0,0.18)] transition-transform duration-150 [transition-timing-function:var(--ease-out)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70">
      <div className="relative mx-1.5 mb-0 mt-1.5 h-44 overflow-hidden rounded-[18px] bg-[linear-gradient(180deg,rgba(17,24,39,0.62),rgba(0,0,0,0.38))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:m-3 sm:h-48 sm:rounded-[18px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.07),transparent_28%)]" />
        <div className="absolute inset-3 z-[1] sm:inset-4">
          <ProgressiveImage src={product.image} thumbnailSrc={product.thumbnailImage} alt={product.name} className="rounded-[10px] object-contain" loading="lazy" onError={onImageLoadError} />
        </div>
      </div>
      <div className="flex flex-1 flex-col bg-black/[0.06] px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
        <div className="mb-1 truncate text-xs font-bold tracking-wide text-orange-500">{product.brand}</div>
        <h3 className="mb-2 line-clamp-2 text-[0.95rem] font-bold leading-tight text-white sm:text-lg">{product.name}</h3>
        <div className="mt-auto pt-2 text-center text-sm text-gray-300">{product.category}</div>
      </div>
    </Link>
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
  const { t } = useLocaleContext();
  const [sourceProduct, setSourceProduct] = useState<Product | null>(initialData?.sourceProduct || null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>(initialData?.similarProducts || []);
  const [styleProducts, setStyleProducts] = useState<Product[]>(initialData?.styleProducts || []);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(!initialData);
  const [behavioralProducts, setBehavioralProducts] = useState<Product[]>([]);
  const [behavioralStatus, setBehavioralStatus] = useState<BehavioralStatus>("idle");
  const [activeSection, setActiveSection] = useState<RecommendationSection>("similar");
  const [behavioralRequestedForId, setBehavioralRequestedForId] = useState<string | null>(null);
  const numericId = parseNumericId(id);
  const impressionKeys = useRef(new Set<string>());

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

  useEffect(() => {
    if (!normalizedSourceProduct) return;
    for (const [tab, products] of [["similar", similarProducts], ["style", styleProducts]] as const) {
      if (!products.length) continue;
      const key = `${numericId}:${tab}:${products.map((product) => product.id).join(",")}`;
      if (impressionKeys.current.has(key)) continue;
      impressionKeys.current.add(key);
      captureEvent("recommendation_impression", { source_product_id: numericId, recommendation_tab: tab, candidate_product_ids: products.map((product) => product.id).join(","), candidate_count: products.length, algorithm_version: "recommendations-v9" });
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

  if (isRecommendationsLoading && !sourceProduct) {
    return <main className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--app-main-pt)] text-white" />;
  }
  if (!normalizedSourceProduct) {
    return <main className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white"><div><p className="text-base font-bold">{t("similar.loadError")}</p><Link href="/" className="mt-4 inline-flex rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-gray-200 transition active:scale-[0.98]">{t("similar.browseProducts")}</Link></div></main>;
  }

  return (
    <main className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--page-header-top)] text-white">
      <div className="mx-auto w-full max-w-7xl">
        <PageHeader
          eyebrow="PRODUCT RECOMMENDATIONS"
          title={t("similar.pageTitle")}
          context={
            <Link
              href={`/?product=${encodeURIComponent(normalizedSourceProduct.id)}`}
              scroll={false}
              className="group flex w-full min-w-0 items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-2.5 text-left transition-[background-color,border-color,transform] duration-150 hover:border-white/[0.15] hover:bg-white/[0.055] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70"
            >
              <div className="isolate h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/[0.06] p-1.5" style={{ position: "relative" }}>
                <ProgressiveImage src={normalizedSourceProduct.image} thumbnailSrc={normalizedSourceProduct.thumbnailImage} alt={normalizedSourceProduct.name} className="rounded-lg object-contain" loading="eager" onError={handleImageLoadError} />
              </div>
              <div className="min-w-0"><p className="text-[11px] font-bold tracking-wide text-gray-500">{t("similar.currentProduct")}</p><p className="mt-1 truncate text-xs font-bold text-orange-300">{normalizedSourceProduct.brand}</p><p className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-gray-100 sm:text-base">{normalizedSourceProduct.name}</p></div>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-500 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          }
        />

        <section className="mt-[var(--page-header-content-gap)] pb-8 sm:pb-10" aria-label={t("similar.recommendationsAria")}>
          <div role="tablist" aria-label={t("similar.criteriaAria")} className="grid grid-cols-3 rounded-2xl border border-white/[0.1] bg-white/[0.045] p-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
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
                  className={`min-h-11 rounded-xl px-2 text-xs font-bold transition-[background-color,color,transform,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 sm:px-4 sm:text-sm ${isActive ? "bg-orange-400 text-black shadow-[0_5px_14px_rgba(249,115,22,0.22)]" : "text-gray-400 hover:bg-white/[0.07] hover:text-white active:scale-[0.98]"}`}
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
              <div key={section.id} id={`${section.id}-recommendation-panel`} role="tabpanel" aria-labelledby={`${section.id}-recommendation-tab`} tabIndex={0} className="pt-7 sm:pt-8">
                <div className="mb-5"><h3 className="text-xl font-black tracking-[-0.02em] text-white">{section.id === "similar" ? t("similar.title.similar") : section.id === "style" ? t("similar.title.style") : t("similar.title.behavioral")}</h3></div>
                {isBehavioral && (!hasProducts || behavioralStatus !== "ready") ? (
                  <EmptyBehavioralCard status={behavioralStatus} />
                ) : hasProducts ? (
                  <div className="grid grid-cols-2 gap-3 pb-2 lg:grid-cols-4 lg:gap-5">{productsForSection.map((product, index) => <ProductCard key={product.id} product={product} tab={section.id} sourceProductId={numericId} position={index + 1} onImageLoadError={handleImageLoadError} />)}</div>
                ) : (
                  <EmptyRecommendationState title={emptyTitle} description={emptyDescription} />
                )}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
