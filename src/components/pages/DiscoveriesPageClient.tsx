"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { DiscoveryProduct } from "../../types";
import { authenticatedFetch, parseApiJson } from "../../api/shared";
import { useLocaleContext } from "../../contexts/LocaleContext";
import { getProductPageUrl } from "../../utils/product";
import { ProgressiveImage } from "../ProgressiveImage";

type DiscoveryData = {
  products: DiscoveryProduct[];
  totalSaveCount: number;
};

function DiscoveryProductCard({ product }: { product: DiscoveryProduct }) {
  const { t } = useLocaleContext();
  const [failedCardImage, setFailedCardImage] = useState(false);
  const [failedDirectImage, setFailedDirectImage] = useState(false);
  const source = product.image || product.thumbnailImage || "";
  const directImage = product.cardThumbnailImage;
  const imageSrc = failedCardImage
    ? source
    : directImage && !failedDirectImage
      ? `/api/products/${encodeURIComponent(product.id)}/card-image`
      : directImage || source;

  return (
    <Link
      href={getProductPageUrl(product)}
      className="ui-product-card ui-card-lift relative flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] border border-white/[0.09] bg-[linear-gradient(180deg,rgba(25,25,29,0.98),rgba(15,15,18,0.98))] text-inherit no-underline shadow-[0_14px_34px_rgba(0,0,0,0.18)] transition-transform duration-150 [transition-timing-function:var(--ease-out)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f5f5f5]">
        {imageSrc ? (
          <ProgressiveImage
            key={imageSrc}
            src={imageSrc}
            thumbnailSrc={product.thumbnailImage}
            alt={product.name}
            className="object-contain"
            loading="lazy"
            onError={() => {
              if (directImage && !failedDirectImage) setFailedDirectImage(true);
              else setFailedCardImage(true);
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold uppercase text-gray-500">{product.brand}</div>
        )}
      </div>
      <div className="flex flex-1 flex-col bg-black/[0.06] px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
        <div className="mb-1 flex items-center gap-2">
          <p className="min-w-0 truncate text-xs font-bold tracking-wide text-orange-500">{product.brand}</p>
          {product.saveCount > 0 && <span className="shrink-0 rounded-md border border-orange-500/35 bg-orange-500/[0.12] px-1.5 py-0.5 text-[9px] font-black leading-none text-orange-300">{t("discoveries.savedByCount", { count: product.saveCount })}</span>}
        </div>
        <h3 className="mb-2 line-clamp-2 text-[0.95rem] font-bold leading-tight text-white sm:text-lg">{product.name}</h3>
        <p className="mt-auto pt-2 text-center text-sm text-gray-300">{product.category}</p>
      </div>
    </Link>
  );
}

export function DiscoveriesPageClient({
  initialData,
  initialError = false,
  profileHref,
}: {
  initialData: DiscoveryData | null;
  initialError?: boolean;
  profileHref: string;
}) {
  const { locale, t } = useLocaleContext();
  const [data, setData] = useState<DiscoveryData>(initialData ?? { products: [], totalSaveCount: 0 });
  const [hasError, setHasError] = useState(initialError);
  const [isRetrying, setIsRetrying] = useState(false);
  const sortedProducts = useMemo(
    () => data.products
      .map((product, index) => ({ product, index }))
      .sort((left, right) => right.product.saveCount - left.product.saveCount || left.index - right.index)
      .map(({ product }) => product),
    [data.products]
  );

  const retry = async () => {
    setIsRetrying(true);
    try {
      const endpoint = "/api/my-discoveries";
      const response = await authenticatedFetch(endpoint);
      const payload = await parseApiJson<{
        ok?: boolean;
        data?: { products?: DiscoveryProduct[]; totalSaveCount?: number };
      }>(response, endpoint);
      if (!response.ok || !payload.ok) throw new Error("discoveries fetch failed");
      setData({
        products: Array.isArray(payload.data?.products) ? payload.data.products : [],
        totalSaveCount: Number(payload.data?.totalSaveCount) || 0,
      });
      setHasError(false);
    } catch {
      setHasError(true);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <main className="settings-page min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--settings-page-top)] text-white">
      <div className="mx-auto w-full max-w-none lg:max-w-3xl">
        <header className="flex items-center gap-0 border-b border-white/10 pb-2 lg:gap-2 lg:pb-6">
          <Link href={profileHref} aria-label={t("discoveries.backToProfile")} title={t("discoveries.backToProfile")} className="relative inline-flex h-11 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-[color,transform] after:absolute after:-inset-x-0.5 after:inset-y-0 after:content-[''] hover:text-white active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 motion-reduce:transform-none motion-reduce:transition-none"><ArrowLeft className="h-[18px] w-[18px]" /></Link>
          <h1 className="text-xl font-extrabold leading-tight tracking-[-0.015em] text-[#f5f5f6] lg:text-2xl">{t("discoveries.performance")}</h1>
        </header>

        {hasError ? (
          <section className="py-20 text-center" aria-live="polite">
            <p className="text-base font-bold text-gray-200">{t("discoveries.loadError")}</p>
            <button type="button" onClick={() => void retry()} disabled={isRetrying} className="mt-5 h-10 rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-bold text-gray-200 transition hover:border-white/25 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60">
              {isRetrying ? t("discoveries.loading") : t("common.retry")}
            </button>
          </section>
        ) : (
          <>
            <section className="mt-6 grid w-full grid-cols-2 gap-3 lg:mt-8" aria-label={t("discoveries.performance")}>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3 py-3 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] sm:px-4 sm:py-4">
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-gray-500">{t("discoveries.statDiscovered")}</p>
                <p className="mt-1.5 text-2xl font-black tracking-[-0.03em] text-white">{data.products.length}{locale === "ko" && <span className="ml-1 text-sm text-gray-400">개</span>}</p>
              </div>
              <div className="rounded-2xl border border-orange-400/20 bg-orange-500/[0.08] px-3 py-3 shadow-[0_1px_0_rgba(255,255,255,0.05)_inset] sm:px-4 sm:py-4">
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-orange-200/80">{t("discoveries.statOtherSaves")}</p>
                <p className="mt-1.5 text-2xl font-black tracking-[-0.03em] text-orange-100">{data.totalSaveCount}{locale === "ko" && <span className="ml-1 text-sm text-orange-200/80">회</span>}</p>
              </div>
            </section>

            <section className="mt-6 lg:mt-10" aria-labelledby="discovered-items-title">
              <div className="mb-3 flex items-end justify-between gap-4 lg:mb-4">
                <h2 id="discovered-items-title" className="text-lg font-black tracking-[-0.02em] text-white">{t("discoveries.itemsHeading")}</h2>
                <p className="text-xs font-semibold text-gray-500">{t("discoveries.sortedBySaves")}</p>
              </div>
              {sortedProducts.length ? (
                <div className="closet-product-grid" style={{ display: "grid" }}>
                  {sortedProducts.map((product) => (
                    <DiscoveryProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] px-5 py-14 text-center">
                  <p className="text-sm font-bold text-gray-300">{t("discoveries.empty")}</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
