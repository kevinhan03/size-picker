"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Info, LoaderCircle, Shirt } from "lucide-react";
import { useRouter } from "next/navigation";
import { createOutfitRequest } from "../../api/outfits";
import { CATEGORY_OPTIONS } from "../../constants";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import type { Product } from "../../types";
import { captureEvent } from "../../utils/analytics";
import { buildLoginHref } from "../../utils/authNavigation";
import { OutfitProductPreviewDialog } from "../outfits/OutfitProductPreviewDialog";
import { OutfitProductTile } from "../outfits/OutfitProductTile";
import { PageState } from "../PageState";

const FOCUS_ITEMS_PAGE_SIZE = 10;

export function NewOutfitRequestPageClient() {
  const router = useRouter();
  const { authUser, isAuthLoading } = useAuthContext();
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

  async function submit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const data = await createOutfitRequest({ description: trimmedDescription, focusProductIds });
      captureEvent("outfit_request_created", { closet_item_count: closetProducts.length, focus_item_count: focusProductIds.length });
      router.replace(`/outfits/${data.request.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "코디 요청을 저장하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isAuthLoading || isLoading || !authUser) {
    return <main className="flex min-h-screen items-center bg-black px-4 pt-[var(--app-main-pt)]"><PageState kind="loading" title="코디 요청을 준비하고 있어요" description="Closet 상품과 계정 정보를 확인하는 중입니다." /></main>;
  }

  return (
    <main className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--app-main-pt)] text-white lg:pt-24">
      <div className="mx-auto max-w-3xl">
        <button type="button" onClick={() => router.back()} className="outfit-detail-pressable flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-gray-400 transition-[background-color,color,transform] duration-150">
          <ArrowLeft className="h-4 w-4" /> 뒤로가기
        </button>

        <header className="mt-5 border-b border-white/[0.08] pb-6">
          <div className="mb-3 flex items-center gap-2 text-orange-400"><Shirt className="h-5 w-5" /><span className="text-xs font-black uppercase tracking-[0.2em]">Style together</span></div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">코디 고민을 들려주세요</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">어디에 입을지, 원하는 분위기와 편한 정도를 알려주세요.</p>
        </header>

        {closetProducts.length < 2 ? (
          <section className="mt-8 rounded-3xl border border-orange-500/25 bg-orange-500/[0.07] p-7 text-center">
            <Shirt className="mx-auto h-9 w-9 text-orange-400" />
            <h2 className="mt-4 text-lg font-bold">Closet 상품이 2개 이상 필요해요</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">실제로 보유한 상품을 Closet에 먼저 담아주세요.</p>
            <button type="button" onClick={() => router.push("/closet")} className="outfit-detail-pressable mt-6 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black">Closet으로 이동</button>
          </section>
        ) : (
          <div className="mt-8 space-y-6">
            <section className="rounded-3xl border border-white/[0.08] bg-[#111114] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3"><label htmlFor="outfit-description" className="text-sm font-black">어떤 코디가 필요하세요?</label><span className="text-xs text-white/35">{description.length}/500</span></div>
              <p id="outfit-description-help" className="mt-2 text-xs leading-5 text-white/55">예: 결혼식 하객룩, 편하게 오래 걸을 수 있는 데이트룩처럼 적어주세요.</p>
              <textarea id="outfit-description" aria-describedby="outfit-description-help outfit-description-limit" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={7} placeholder="이번 주말 친구 결혼식에 가요. 정장처럼 너무 격식 차리지 않으면서 단정해 보였으면 좋겠어요. 많이 걸어도 불편하지 않은 신발도 원하고 있어요." className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-white/25 focus:border-orange-500/70 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]" />
              <p id="outfit-description-limit" className={`mt-2 text-xs ${trimmedDescription.length > 0 && trimmedDescription.length < 20 ? "font-semibold text-orange-300" : "text-white/35"}`}>{trimmedDescription.length > 0 && trimmedDescription.length < 20 ? `조금만 더 적어주세요. 최소 20자예요. (${trimmedDescription.length}/20)` : "최소 20자 이상 작성해주세요."}</p>
            </section>

            <section className="rounded-3xl border border-white/[0.08] bg-[#111114] p-5 sm:p-6">
              <div className="relative min-h-[3.25rem]">
                <h2 className="text-sm font-black">활용 희망 아이템</h2>
                <p className="mt-2 whitespace-nowrap text-[11px] leading-5 text-white/55 sm:text-xs">함께 고려할 아이템을 골라주세요. 최대 3개</p>
                {focusProductIds.length > 0 && <span className="absolute right-0 top-0 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-200">{focusProductIds.length}개 선택됨</span>}
              </div>

              <div className="relative mt-4">
                <div className="flex gap-1 overflow-x-auto pb-1 pr-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button type="button" aria-pressed={!focusCategory} onClick={() => selectFocusCategory("")} className={`outfit-detail-pressable min-h-10 shrink-0 border-b-2 px-3.5 text-xs font-bold transition-[border-color,color,transform] duration-150 ${!focusCategory ? "border-orange-400 text-orange-200" : "border-transparent text-white/45"}`}>전체</button>
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

              {hiddenFocusItemCount > 0 && <button type="button" aria-controls="focus-product-grid" onClick={() => setVisibleFocusItemCount((current) => current + FOCUS_ITEMS_PAGE_SIZE)} className="outfit-detail-pressable outfit-detail-secondary-action mt-4 flex min-h-11 w-full flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-white/55 transition-[background-color,border-color,color,transform] duration-150"><span className="text-sm font-bold">아이템 {Math.min(FOCUS_ITEMS_PAGE_SIZE, hiddenFocusItemCount)}개 더 보기</span><span className="mt-0.5 text-xs font-semibold text-white/35">{hiddenFocusItemCount}개 남음</span></button>}
              {focusProductIds.length >= 3 && <p role="status" className="mt-4 text-xs font-semibold text-orange-300">최대 선택 개수예요. 선택한 아이템은 다시 눌러 뺄 수 있어요.</p>}
              <div className="mt-5 flex items-start gap-2 border-t border-white/[0.08] pt-4 text-xs leading-5 text-white/45"><Info className="mt-0.5 h-4 w-4 shrink-0 text-orange-400/80" /><p>상품 이미지·브랜드·상품명만 공유되며, 사이즈와 착용 정보는 공개되지 않아요.</p></div>
            </section>

            {error && <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
            <button disabled={!canSubmit || submitting} onClick={() => void submit()} className="outfit-detail-pressable flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-sm font-black text-black transition-[background-color,color,transform] duration-150 hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/35">{submitting && <LoaderCircle className="h-5 w-5 animate-spin" />}{submitting ? "요청 올리는 중…" : "코디 요청 올리기"}</button>
          </div>
        )}
        {previewProduct && <OutfitProductPreviewDialog product={previewProduct} onClose={() => setPreviewProduct(null)} selected={focusProductIds.includes(String(previewProduct.id))} selectionDisabled={focusProductIds.length >= 3 && !focusProductIds.includes(String(previewProduct.id))} onToggle={() => toggleFocusProduct(String(previewProduct.id))} selectLabel="활용 희망 아이템으로 선택" selectedLabel="활용 희망 아이템으로 선택됨" />}
      </div>
    </main>
  );
}
