"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Info, LoaderCircle, Shirt } from "lucide-react";
import { useRouter } from "next/navigation";
import { createOutfitRequest } from "../../api/outfits";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { captureEvent } from "../../utils/analytics";
import { buildLoginHref } from "../../utils/authNavigation";
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

  const canSubmit = description.trim().length >= 20 && description.trim().length <= 500 && closetProducts.length >= 2;
  const focusCategories = useMemo(
    () => [...new Set(closetProducts.map((product) => product.category?.trim()).filter(Boolean))] as string[],
    [closetProducts]
  );
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
      const data = await createOutfitRequest({
        description: description.trim(),
        focusProductIds,
      });
      captureEvent("outfit_request_created", {
        closet_item_count: closetProducts.length,
        focus_item_count: focusProductIds.length,
      });
      router.replace(`/outfits/${data.request.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "코디 요청을 저장하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isAuthLoading || isLoading || !authUser) return <main className="flex min-h-screen items-center bg-black px-4 pt-[var(--app-main-pt)]"><PageState kind="loading" title="코디 요청을 준비하고 있어요" description="Closet 상품과 계정 정보를 확인하는 중입니다." /></main>;

  return (
    <main className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--app-main-pt)] text-white">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-black"><Shirt className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><h1 className="text-2xl font-black sm:text-3xl">코디 요청하기</h1><p className="mt-1 text-sm text-white/45">입을 옷에 대한 고민을 자유롭게 알려주세요.</p></div>
          <button type="button" onClick={() => router.back()} aria-label="이전 화면으로 돌아가기" title="돌아가기" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-white/[0.06] hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
        </div>

        {closetProducts.length < 2 ? (
          <section className="mt-8 rounded-3xl border border-orange-500/25 bg-orange-500/[0.07] p-7 text-center">
            <Shirt className="mx-auto h-9 w-9 text-orange-400" /><h2 className="mt-4 text-lg font-bold">Closet 상품이 2개 이상 필요해요</h2><p className="mt-2 text-sm leading-6 text-white/50">실제로 보유한 상품을 Closet에 먼저 담아주세요.</p><button onClick={() => router.push("/closet")} className="mt-6 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black">Closet으로 이동</button>
          </section>
        ) : (
          <div className="mt-8 space-y-8">
            <section><div className="flex items-center justify-between"><label htmlFor="outfit-description" className="text-sm font-black">어떤 코디가 필요한가요?</label><span className="text-xs text-white/35">{description.length}/500</span></div><p id="outfit-description-help" className="mt-2 text-xs leading-5 text-white/45">상황, 원하는 분위기, 꼭 입고 싶은 옷이나 피하고 싶은 조합을 자유롭게 적어주세요.</p><textarea id="outfit-description" aria-describedby="outfit-description-help outfit-description-limit" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={7} placeholder="이번 주말 친구 결혼식에 가요. 정장처럼 너무 격식 차리지는 않으면서 단정해 보였으면 좋겠어요. 많이 걸어서 불편한 신발은 피하고 싶어요." className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-[#111114] p-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-orange-500/60" /><p id="outfit-description-limit" className="mt-2 text-xs text-white/35">최소 20자 이상 작성해주세요.</p></section>
            <section className="relative overflow-hidden rounded-3xl border border-orange-500/25 bg-[linear-gradient(180deg,rgba(249,115,22,0.075),rgba(255,255,255,0.025)_32%,rgba(255,255,255,0.015))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_50px_rgba(0,0,0,0.2)] sm:p-6">
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/70 to-transparent" />
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-sm font-black">우선 활용할 옷 <span className="font-medium text-white/35">(선택)</span></h2>
                  <p className="mt-2 text-xs leading-5 text-white/45">꼭 활용해보고 싶은 옷이 있다면 선택해주세요.</p>
                  <p className="text-xs leading-5 text-white/45">어울리는 조합이 없다면 다른 사용자가 대안 코디를 제안할 수도 있어요.</p>
                </div>
                <span className={`shrink-0 text-xs font-black ${focusProductIds.length ? "text-orange-400" : "text-white/30"}`}>{focusProductIds.length}/3</span>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  aria-pressed={!focusCategory}
                  onClick={() => selectFocusCategory("")}
                  className={`min-h-9 shrink-0 rounded-full border px-4 text-xs font-bold transition ${
                    !focusCategory
                      ? "border-orange-500/50 bg-orange-500/15 text-orange-300"
                      : "border-white/10 bg-white/[0.04] text-white/45 hover:border-white/20 hover:text-white"
                  }`}
                >
                  전체
                </button>
                {focusCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={focusCategory === category}
                    onClick={() => selectFocusCategory(category)}
                    className={`min-h-9 shrink-0 rounded-full border px-4 text-xs font-bold transition ${
                      focusCategory === category
                        ? "border-orange-500/50 bg-orange-500/15 text-orange-300"
                        : "border-white/10 bg-white/[0.04] text-white/45 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="mt-3 touch-pan-y">
                <div id="focus-product-grid" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {displayedFocusProducts.map((product) => {
                    const productId = String(product.id);
                    return (
                      <OutfitProductTile
                        key={product.id}
                        product={product}
                        selectable
                        selected={focusProductIds.includes(productId)}
                        order={focusProductIds.indexOf(productId) + 1}
                        onClick={() => toggleFocusProduct(productId)}
                      />
                    );
                  })}
                </div>
              </div>
              {hiddenFocusItemCount > 0 && (
                <button
                  type="button"
                  aria-controls="focus-product-grid"
                  onClick={() => setVisibleFocusItemCount((current) => current + FOCUS_ITEMS_PAGE_SIZE)}
                  className="mt-4 min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm font-bold text-white/60 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                >
                  옷 더 보기 · {hiddenFocusItemCount}개 남음
                </button>
              )}
              {focusProductIds.length >= 3 && <p className="mt-3 text-xs font-semibold text-orange-300">최대 3개까지 선택할 수 있어요.</p>}
            </section>
            <div className="flex items-start gap-2 px-1 text-xs leading-5 text-white/45">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-orange-400/80" />
              <p>
                다른 사용자는 코디를 제안하기 위해 내 Closet에 담긴 상품 {closetProducts.length}개를 확인할 수 있습니다. 상품 이미지·브랜드·상품명만 공개되며, 저장한 사이즈와 착용 정보는 공개되지 않습니다.
              </p>
            </div>
            {error && <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
            <button disabled={!canSubmit || submitting} onClick={() => void submit()} className="flex w-full items-center justify-center rounded-2xl bg-orange-500 py-4 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-35">{submitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : "코디 요청 올리기"}</button>
          </div>
        )}
      </div>
    </main>
  );
}
