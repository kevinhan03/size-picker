"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Info, LoaderCircle, Shirt } from "lucide-react";
import { useRouter } from "next/navigation";
import { createOutfitRequest } from "../../api/outfits";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useLocaleContext } from "../../contexts/LocaleContext";
import type { Product } from "../../types";
import { captureEvent } from "../../utils/analytics";
import { buildLoginHref } from "../../utils/authNavigation";
import { OutfitProductPreviewDialog } from "../outfits/OutfitProductPreviewDialog";
import { OutfitProductTile } from "../outfits/OutfitProductTile";
import { OutfitLoadingState } from "../outfits/OutfitLoadingState";
import { CategoryTabs } from "../CategoryTabs";

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
    return <OutfitLoadingState variant="request" title={t("outfits.loading")} description={t("outfits.new.loadingDescription")} />;
  }

  return (
    <main className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--app-main-pt)] text-white lg:pt-24">
      <div className="mx-auto max-w-5xl">
        {closetProducts.length < 2 ? (
          <section className="relative mx-auto max-w-3xl rounded-3xl border border-orange-500/25 bg-orange-500/[0.07] p-7 text-center">
            <button type="button" onClick={cancelRequest} aria-label={t("outfits.new.cancel")} className="outfit-detail-pressable absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-white/55 transition-[background-color,color,transform] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70"><ArrowLeft className="h-4 w-4" /></button>
            <Shirt className="mx-auto h-9 w-9 text-orange-400" />
            <h2 className="mt-4 text-lg font-bold">{t("outfits.new.closetRequired")}</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">{t("outfits.new.closetRequiredDescription")}</p>
            <button type="button" onClick={() => router.push("/closet")} className="outfit-detail-pressable mt-6 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black">{t("outfits.new.goToCloset")}</button>
          </section>
        ) : (
          <div className="space-y-8">
            <section className="rounded-3xl border border-white/[0.1] bg-[#111114] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-7">
              <div>
                <div className="relative flex h-10 items-center justify-between gap-3"><button type="button" onClick={cancelRequest} aria-label={t("outfits.new.cancel")} className="outfit-detail-pressable -ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/55 transition-[background-color,color,transform] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70"><ArrowLeft className="h-4 w-4" /></button><label htmlFor="outfit-description" className="pointer-events-none absolute left-1/2 max-w-[calc(100%-10rem)] -translate-x-1/2 truncate text-sm font-black">{t("outfits.new.question")}</label><span className="shrink-0 text-xs text-white/35">{description.length}/500</span></div>
                <textarea id="outfit-description" aria-describedby="outfit-description-limit" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={7} placeholder={t("outfits.new.placeholder")} className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-white/25 focus:border-orange-500/70 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]" />
                <p id="outfit-description-limit" className={`mt-2 text-xs ${trimmedDescription.length > 0 && trimmedDescription.length < 20 ? "font-semibold text-orange-300" : "text-white/35"}`}>{trimmedDescription.length > 0 && trimmedDescription.length < 20 ? t("outfits.new.minimumProgress", { count: trimmedDescription.length }) : t("outfits.new.minimum")}</p>
              </div>
            </section>

            <section className="scroll-mt-24">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-black tracking-[-0.015em]">{t("outfits.new.focusItems")}</h2>
                  <p className="mt-1 break-keep text-sm leading-5 text-white/55">{t("outfits.new.focusItemsHelp")}</p>
                </div>
                {focusProductIds.length > 0 && <span className="shrink-0 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-200">{t("outfits.new.selectedCount", { count: focusProductIds.length })}</span>}
              </div>

              <CategoryTabs category={focusCategory} onCategoryChange={(category) => selectFocusCategory(category)} allLabel={t("outfits.new.all")} ariaLabel="활용 희망 아이템 카테고리" className="mt-4" spacing="default" alignment="center" />

              <div className="mt-0 touch-pan-y">
                {displayedFocusProducts.length === 0 ? (
                  <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.12] bg-black/15 px-5 text-center">
                    <Shirt className="h-6 w-6 text-white/25" />
                    <p className="mt-3 text-sm font-bold text-white/65">{t("outfits.new.emptyCategory")}</p>
                    <button type="button" onClick={() => selectFocusCategory("")} className="outfit-detail-pressable mt-3 min-h-9 rounded-full px-3 text-xs font-bold text-orange-300 transition-[background-color,color,transform] hover:text-orange-200">{t("outfits.new.viewAll")}</button>
                  </div>
                ) : (
                  <div id="focus-product-grid" className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {displayedFocusProducts.map((product) => {
                      const productId = String(product.id);
                      return <OutfitProductTile key={product.id} product={product} selectable selected={focusProductIds.includes(productId)} selectionLimitReached={focusProductIds.length >= 3} onClick={() => toggleFocusProduct(productId)} onPreview={() => setPreviewProduct(product)} />;
                    })}
                  </div>
                )}
              </div>

              {hiddenFocusItemCount > 0 && <button type="button" aria-controls="focus-product-grid" onClick={() => setVisibleFocusItemCount((current) => current + FOCUS_ITEMS_PAGE_SIZE)} className="outfit-detail-pressable outfit-detail-secondary-action mt-4 flex min-h-11 w-full flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-white/55 transition-[background-color,border-color,color,transform] duration-150"><span className="text-sm font-bold">{t("outfits.new.moreItems", { count: Math.min(FOCUS_ITEMS_PAGE_SIZE, hiddenFocusItemCount) })}</span><span className="mt-0.5 text-xs font-semibold text-white/35">{t("outfits.new.remainingItems", { count: hiddenFocusItemCount })}</span></button>}
              {focusProductIds.length >= 3 && <p role="status" className="mt-4 text-xs font-semibold text-orange-300">{t("outfits.new.selectionLimit")}</p>}
              <div className="mt-5 flex items-start gap-2 border-t border-white/[0.08] pt-4 text-xs leading-5 text-white/45"><Info className="mt-0.5 h-4 w-4 shrink-0 text-orange-400/80" /><p>{t("outfits.new.privacy")}</p></div>
            </section>

            {error && <p className="mx-auto max-w-3xl rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
            <div className="mx-auto max-w-3xl space-y-2">
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
