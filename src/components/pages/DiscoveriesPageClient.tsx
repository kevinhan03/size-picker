"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { DiscoveryProduct } from "../../types";
import { authenticatedFetch, parseApiJson } from "../../api/shared";
import { useLocaleContext } from "../../contexts/LocaleContext";
import { getProductPageUrl } from "../../utils/product";
import { PageHeader } from "../PageHeader";

type DiscoveryData = {
  products: DiscoveryProduct[];
  totalSaveCount: number;
};

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
    <main className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--page-header-top)] text-white">
      <div className="mx-auto w-full max-w-[70rem]">
        <div className="relative">
          <PageHeader
            eyebrow="MY DISCOVERIES"
            title={t("discoveries.performance")}
            className="pr-14"
          />
          <Link href={profileHref} aria-label={t("discoveries.backToProfile")} title={t("discoveries.backToProfile")} className="absolute right-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-gray-400 transition-colors hover:border-white/[0.18] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 motion-reduce:transition-none"><ArrowLeft className="h-4 w-4" /></Link>
        </div>

        {hasError ? (
          <section className="py-20 text-center" aria-live="polite">
            <p className="text-base font-bold text-gray-200">{t("discoveries.loadError")}</p>
            <button type="button" onClick={() => void retry()} disabled={isRetrying} className="mt-5 h-10 rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-bold text-gray-200 transition hover:border-white/25 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60">
              {isRetrying ? t("discoveries.loading") : t("common.retry")}
            </button>
          </section>
        ) : (
          <>
            <section className="mt-8 grid w-full grid-cols-2 gap-3" aria-label={t("discoveries.performance")}>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-4 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-gray-500">{t("discoveries.statDiscovered")}</p>
                <p className="mt-1.5 text-2xl font-black tracking-[-0.03em] text-white">{data.products.length}{locale === "ko" && <span className="ml-1 text-sm text-gray-400">개</span>}</p>
              </div>
              <div className="rounded-2xl border border-orange-400/20 bg-orange-500/[0.08] px-4 py-4 shadow-[0_1px_0_rgba(255,255,255,0.05)_inset]">
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-orange-200/80">{t("discoveries.statOtherSaves")}</p>
                <p className="mt-1.5 text-2xl font-black tracking-[-0.03em] text-orange-100">{data.totalSaveCount}{locale === "ko" && <span className="ml-1 text-sm text-orange-200/80">회</span>}</p>
              </div>
            </section>

            <section className="mt-10" aria-labelledby="discovered-items-title">
              <div className="mb-4 flex items-end justify-between gap-4">
                <h2 id="discovered-items-title" className="text-lg font-black tracking-[-0.02em] text-white">{t("discoveries.itemsHeading")}</h2>
                <p className="text-xs font-semibold text-gray-500">{t("discoveries.sortedBySaves")}</p>
              </div>
              {sortedProducts.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {sortedProducts.map((product) => (
                    <Link key={product.id} href={getProductPageUrl(product)} className="group min-w-0 overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.035] no-underline transition-[border-color,background-color,transform] duration-150 hover:border-orange-400/60 hover:bg-white/[0.055] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 motion-reduce:transform-none motion-reduce:transition-none">
                      <div className="aspect-square bg-white/[0.04] p-2 sm:p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element -- Product image sources retain existing native-image fallback behavior. */}
                        <img src={product.thumbnailImage || product.image} alt={product.name} className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transition-none" />
                      </div>
                      <div className="min-w-0 p-3 sm:p-4">
                        <p className="truncate text-[11px] font-bold uppercase tracking-wide text-orange-300">{product.brand}</p>
                        <p className="mt-1 line-clamp-2 text-sm font-black leading-5 text-white">{product.name}</p>
                        <p className={`mt-2 text-xs font-bold ${product.saveCount > 0 ? "text-orange-200" : "text-gray-500"}`}>{product.saveCount > 0 ? t("discoveries.savedByCount", { count: product.saveCount }) : t("discoveries.savedByNone")}</p>
                      </div>
                    </Link>
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
