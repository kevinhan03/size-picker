"use client";

import { useEffect, useMemo, useState } from "react";
import { Info, LoaderCircle, Shirt } from "lucide-react";
import { useRouter } from "next/navigation";
import { createOutfitRequest } from "../../api/outfits";
import { CATEGORY_OPTIONS } from "../../constants";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useLocaleContext } from "../../contexts/LocaleContext";
import type { Product } from "../../types";
import { captureEvent } from "../../utils/analytics";
import { buildLoginHref } from "../../utils/authNavigation";
import { OutfitProductPreviewDialog } from "../outfits/OutfitProductPreviewDialog";
import { OutfitProductTile } from "../outfits/OutfitProductTile";
import { PageHeader } from "../PageHeader";
import { PageState } from "../PageState";

const FOCUS_ITEMS_PAGE_SIZE = 10;

export function NewOutfitRequestPageClient() {
  const router = useRouter();
  const { authUser, isAuthLoading } = useAuthContext();
  const { t } = useLocaleContext();
  const authUserId = authUser?.id;
  const { closetProducts, isLoading, ensureLoaded } = useClosetContext();
  const [description, setDescription] = useState("");
  const [focusProductIds, setFocusProductIds] = useState<string[]>([]);
  const [focusCategory, setFocusCategory] = useState("");
  const [visibleFocusItemCount, setVisibleFocusItemCount] = useState(FOCUS_ITEMS_PAGE_SIZE);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthLoading) return;
    if (!authUserId) {
      router.replace(buildLoginHref("login", "/outfits/new"));
      return;
    }
    ensureLoaded();
  }, [authUserId, ensureLoaded, isAuthLoading, router]);

  const trimmedDescription = description.trim();
  const canSubmit = trimmedDescription.length >= 20 && trimmedDescription.length <= 500 && closetProducts.length >= 2;
  const focusCategories = useMemo(() => {
    const categories = new Set(closetProducts.map((product) => product.category?.trim()).filter(Boolean));
    const orderedCategories = CATEGORY_OPTIONS.filter((category) => categories.delete(category));
    return [...orderedCategories, ...Array.from(categories).sort((left, right) => left.localeCompare(right))];
  }, [closetProducts]);
  const visibleFocusProducts = useMemo(
    () => (focusCategory ? closetProducts.filter((product) => product.category?.trim() === focusCategory) : closetProducts),
    [closetProducts, focusCategory]
  );
  const displayedFocusProducts = visibleFocusProducts.slice(0, visibleFocusItemCount);
  const hiddenFocusItemCount = Math.max(0, visibleFocusProducts.length - displayedFocusProducts.length);

  function selectFocusCategory(category: string) {
    if (category === focusCategory) return;
    setFocusCategory(category);
    setVisibleFocusItemCount(FOCUS_ITEMS_PAGE_SIZE);
  }

  function toggleFocusProduct(productId: string) {
    setFocusProductIds((current) => {
      if (current.includes(productId)) return current.filter((id) => id !== productId);
      if (current.length >= 3) return current;
      return [...current, productId];
    });
  }

  function cancelRequest() {
    const hasDraft = trimmedDescription.length > 0 || focusProductIds.length > 0;
    if (hasDraft && !window.confirm(t("outfits.new.discardConfirm"))) return;
    router.replace("/outfits");
  }

  async function submit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const data = await createOutfitRequest({ description: trimmedDescription, focusProductIds });
      captureEvent("outfit_request_created", { closet_item_count: closetProducts.length, focus_item_count: focusProductIds.length });
      router.replace(`/outfits/${data.request.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("outfits.new.saveError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (isAuthLoading || isLoading || !authUser) {
    return <main className="flex min-h-screen items-center bg-black px-4 pt-[var(--app-main-pt)]"><PageState kind="loading" title={t("outfits.loading")} description={t("outfits.new.loadingDescription")} /></main>;
  }

  return (
    <main className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--page-header-top)] text-white">
      <div className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow="STYLE TOGETHER"
          title={t("outfits.new.title")}
          description={t("outfits.new.description")}
        />

        {closetProducts.length < 2 ? (
          <section className="mt-[var(--page-header-content-gap)] rounded-3xl border border-orange-500/25 bg-orange-500/[0.07] p-7 text-center">
            <Shirt className="mx-auto h-9 w-9 text-orange-400" />
            <h2 className="mt-4 text-lg font-bold">{t("outfits.new.closetRequired")}</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">{t("outfits.new.closetRequiredDescription")}</p>
            <button type="button" onClick={() => router.push("/closet")} className="outfit-detail-pressable mt-6 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black">{t("outfits.new.goToCloset")}</button>
          </section>
        ) : (
          <div className="mt-[var(--page-header-content-gap)] space-y-6">
            <section className="rounded-3xl border border-white/[0.08] bg-[#111114] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3"><label htmlFor="outfit-description" className="text-sm font-black">{t("outfits.new.question")}</label><span className="text-xs text-white/35">{description.length}/500</span></div>
              <p id="outfit-description-help" className="mt-2 text-xs leading-5 text-white/55">{t("outfits.new.questionHelp")}</p>
              <textarea id="outfit-description" aria-describedby="outfit-description-help outfit-description-limit" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={7} placeholder={t("outfits.new.placeholder")} className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-white/25 focus:border-orange-500/70 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]" />
              <p id="outfit-description-limit" className={`mt-2 text-xs ${trimmedDescription.length > 0 && trimmedDescription.length < 20 ? "font-semibold text-orange-300" : "text-white/35"}`}>{trimmedDescription.length > 0 && trimmedDescription.length < 20 ? t("outfits.new.minimumProgress", { count: trimmedDescription.length }) : t("outfits.new.minimum")}</p>
            </section>

            <section className="rounded-3xl border border-white/[0.08] bg-[#111114] p-5 sm:p-6">
              <div className="relative min-h-[3.25rem]">
                <h2 className="text-sm font-black">{t("outfits.new.focusItems")}</h2>
                <p className="mt-2 whitespace-nowrap text-[11px] leading-5 text-white/55 sm:text-xs">{t("outfits.new.focusItemsHelp")}</p>
                {focusProductIds.length > 0 && <span className="absolute right-0 top-0 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-200">{t("outfits.new.selectedCount", { count: focusProductIds.length })}</span>}
              </div>

              <div className="relative mt-4">
                <div className="flex gap-1 overflow-x-auto pb-1 pr-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button type="button" aria-pressed={!focusCategory} onClick={() => selectFocusCategory("")} className={`outfit-detail-pressable min-h-10 shrink-0 border-b-2 px-3.5 text-xs font-bold transition-[border-color,color,transform] duration-150 ${!focusCategory ? "border-orange-400 text-orange-200" : "border-transparent text-white/45"}`}>{t("outfits.new.all")}</button>
                  {focusCategories.map((category) => <button key={category} type="button" aria-pressed={focusCategory === category} onClick={() => selectFocusCategory(category)} className={`outfit-detail-pressable min-h-10 shrink-0 border-b-2 px-3.5 text-xs font-bold transition-[border-color,color,transform] duration-150 ${focusCategory === category ? "border-orange-400 text-orange-200" : "border-transparent text-white/45"}`}>{category}</button>)}
                </div>
                <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#111114] via-[#111114]/90 to-transparent" />
              </div>

              <div className="mt-5 touch-pan-y"><div id="focus-product-grid" className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {displayedFocusProducts.map((product) => {
                  const productId = String(product.id);
                  return <OutfitProductTile key={product.id} product={product} selectable selected={focusProductIds.includes(productId)} selectionLimitReached={focusProductIds.length >= 3} onClick={() => toggleFocusProduct(productId)} onPreview={() => setPreviewProduct(product)} />;
                })}
              </div></div>

              {hiddenFocusItemCount > 0 && <button type="button" aria-controls="focus-product-grid" onClick={() => setVisibleFocusItemCount((current) => current + FOCUS_ITEMS_PAGE_SIZE)} className="outfit-detail-pressable outfit-detail-secondary-action mt-4 flex min-h-11 w-full flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-white/55 transition-[background-color,border-color,color,transform] duration-150"><span className="text-sm font-bold">{t("outfits.new.moreItems", { count: Math.min(FOCUS_ITEMS_PAGE_SIZE, hiddenFocusItemCount) })}</span><span className="mt-0.5 text-xs font-semibold text-white/35">{t("outfits.new.remainingItems", { count: hiddenFocusItemCount })}</span></button>}
              {focusProductIds.length >= 3 && <p role="status" className="mt-4 text-xs font-semibold text-orange-300">{t("outfits.new.selectionLimit")}</p>}
              <div className="mt-5 flex items-start gap-2 border-t border-white/[0.08] pt-4 text-xs leading-5 text-white/45"><Info className="mt-0.5 h-4 w-4 shrink-0 text-orange-400/80" /><p>{t("outfits.new.privacy")}</p></div>
            </section>

            {error && <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
            <div className="space-y-2">
              <button disabled={!canSubmit || submitting} onClick={() => void submit()} className="outfit-detail-pressable flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-sm font-black text-black transition-[background-color,color,transform] duration-150 hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/35">{submitting && <LoaderCircle className="h-5 w-5 animate-spin" />}{submitting ? t("outfits.new.submitting") : t("outfits.new.submit")}</button>
              <button type="button" onClick={cancelRequest} className="outfit-detail-pressable flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-bold text-white/45 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.05] hover:text-white">{t("outfits.new.cancel")}</button>
            </div>
          </div>
        )}
        {previewProduct && <OutfitProductPreviewDialog product={previewProduct} onClose={() => setPreviewProduct(null)} selected={focusProductIds.includes(String(previewProduct.id))} selectionDisabled={focusProductIds.length >= 3 && !focusProductIds.includes(String(previewProduct.id))} onToggle={() => toggleFocusProduct(String(previewProduct.id))} selectLabel={t("outfits.new.selectFocusItem")} selectedLabel={t("outfits.new.selectedFocusItem")} />}
      </div>
    </main>
  );
}
