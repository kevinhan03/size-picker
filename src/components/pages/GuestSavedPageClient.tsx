"use client";

import { ArrowRight, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product, StyleTagName } from "../../types";
import { useAuthContext } from "../../contexts/AuthContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { buildLoginHref, saveAuthContinuation } from "../../utils/authNavigation";
import { requestGuestDigboxImport } from "../../utils/guestDigbox";
import { getEffectiveStyleTags, normalizeStyleTags, styleTagLabel } from "../../utils/tasteGraph";
import { PageHeader } from "../PageHeader";
import { ProgressiveImage } from "../ProgressiveImage";

function getProductStyleShares(product: Product) {
  const tags = normalizeStyleTags(getEffectiveStyleTags(product).tags);
  const entries = (Object.entries(tags) as Array<[StyleTagName, number]>).filter(([, score]) => Number.isFinite(score) && score > 0);
  const topEntries = entries.sort((left, right) => right[1] - left[1]).slice(0, 2);
  const total = topEntries.reduce((sum, [, score]) => sum + score, 0);
  return total ? topEntries.map(([tag, score]) => ({ tag, share: Math.round((score / total) * 100) })) : [];
}

function getTasteShares(products: Product[]) {
  const totals = new Map<StyleTagName, number>();
  for (const product of products) {
    for (const { tag, share } of getProductStyleShares(product)) totals.set(tag, (totals.get(tag) || 0) + share);
  }
  const total = Array.from(totals.values()).reduce((sum, share) => sum + share, 0);
  return total
    ? Array.from(totals, ([tag, share]) => ({ tag, share: Math.round((share / total) * 100) })).sort((left, right) => right.share - left.share)
    : [];
}

export function GuestSavedPageClient() {
  const router = useRouter();
  const auth = useAuthContext();
  const digbox = useDigboxContext();
  const tasteSignals = useMemo(() => getTasteShares(digbox.guestProducts).slice(0, 3), [digbox.guestProducts]);
  const productStyleShares = useMemo(
    () => new Map(digbox.guestProducts.map((product) => [product.id, getProductStyleShares(product)])),
    [digbox.guestProducts]
  );
  const isComplete = digbox.guestCount === digbox.guestLimit;
  const remainingCount = Math.max(0, digbox.guestLimit - digbox.guestCount);

  useEffect(() => {
    if (!auth.isAuthLoading && auth.authUser) {
      router.replace(auth.dbUsername ? `/u/${encodeURIComponent(auth.dbUsername)}` : "/mypage");
    }
  }, [auth.authUser, auth.dbUsername, auth.isAuthLoading, router]);

  const startSignup = () => {
    requestGuestDigboxImport();
    saveAuthContinuation({ intent: "signup", returnTo: "/saved", source: "guest_digbox" });
    router.push(buildLoginHref("signup", "/saved", "saved"));
  };

  const title = isComplete
    ? "당신의 첫 취향 분석"
    : digbox.guestCount === 0
      ? "마음에 드는 상품을 찾아볼까요?"
      : "조금만 더 저장해볼까요?";
  const description = isComplete
    ? "고른 상품에서 어떤 스타일을 좋아하는지 살펴봤어요."
    : digbox.guestCount === 0
      ? "디깅에서 상품 카드의 별을 눌러 3개를 임시 저장해 보세요. 고른 상품으로 첫 취향 분석을 보여드려요."
      : `디깅에서 상품을 ${remainingCount}개 더 저장하면, 고른 상품의 공통 스타일을 보여드려요.`;

  return (
    <main className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--page-header-top)] text-white">
      <div className="mx-auto w-full max-w-[70rem]">
        <PageHeader eyebrow="MY SAVED" title={title} description={description} />
        <section className="mt-[var(--page-header-content-gap)] rounded-2xl border border-white/[0.1] bg-[#141416] px-5 py-5 sm:px-6 lg:px-8" aria-label="첫 취향 분석 진행 상태">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300"><Star className="h-5 w-5" aria-hidden="true" /></span>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-white">첫 취향 분석까지 · {digbox.guestCount}/{digbox.guestLimit}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#aeb7c4]">{isComplete ? "고른 상품의 공통 스타일을 확인했어요." : `${remainingCount}개를 더 저장하면, 고른 상품의 공통 스타일을 보여드려요.`}</p>
                {!isComplete && <div className="mt-3 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-orange-400 transition-[width] duration-[var(--duration-layer-enter)] [transition-timing-function:var(--ease-out)] motion-reduce:transition-none" style={{ width: `${(digbox.guestCount / digbox.guestLimit) * 100}%` }} /></div>}
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              {isComplete ? <button type="button" onClick={startSignup} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-extrabold text-black transition-[background-color,transform] duration-[var(--duration-press)] [transition-timing-function:var(--ease-press)] hover:bg-orange-400 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"><span>이 3개 저장하고 내 DIGBOX 시작하기</span><ArrowRight className="h-4 w-4" /></button> : <Link href="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-extrabold text-black transition-[background-color,transform] duration-[var(--duration-press)] [transition-timing-function:var(--ease-press)] hover:bg-orange-400 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">디깅하러 가기<ArrowRight className="h-4 w-4" /></Link>}
            </div>
          </div>
        </section>

        {isComplete && tasteSignals.length > 0 && (
          <section className="mt-4 grid gap-6 rounded-2xl border border-sky-400/20 bg-sky-400/[0.07] p-5 sm:p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:px-8" aria-label="내가 고른 스타일">
            <div><p className="text-xs font-extrabold text-sky-300">내가 고른 스타일</p><p className="mt-2 text-xl font-extrabold leading-snug text-white"><span className="text-sky-200">{styleTagLabel(tasteSignals[0].tag)}</span>이 가장 큰 비중을 차지해요.</p><p className="mt-2 text-sm font-semibold leading-6 text-sky-100/75">고른 3개 상품의 스타일을 100% 기준으로 나눠 봤어요.</p></div>
            <div className="space-y-3">{tasteSignals.map((signal) => <div key={signal.tag}><div className="flex justify-between text-xs"><span className="font-bold text-white">{styleTagLabel(signal.tag)}</span><span className="font-bold text-sky-200">{signal.share}%</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sky-100/10"><div className="h-full rounded-full bg-sky-300 transition-[width] duration-[var(--duration-layer-enter)] [transition-timing-function:var(--ease-out)] motion-reduce:transition-none" style={{ width: `${signal.share}%` }} /></div></div>)}</div>
          </section>
        )}

        {digbox.guestProducts.length > 0 && <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="임시 저장한 상품">
          {digbox.guestProducts.map((product) => <div key={product.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/[0.05]"><ProgressiveImage src={product.thumbnailImage || product.image} thumbnailSrc={product.thumbnailImage} alt={product.name} className="object-contain" /></div><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-extrabold uppercase tracking-wide text-orange-400">{product.brand}</p><p className="truncate text-sm font-bold text-white">{product.name}</p>{productStyleShares.get(product.id)?.length ? <p className="mt-1 truncate text-xs font-semibold text-sky-200">{productStyleShares.get(product.id)!.map(({ tag, share }) => `${styleTagLabel(tag)} ${share}%`).join(" · ")}</p> : null}</div><button type="button" onClick={() => digbox.removeGuestItem(product.id)} aria-label={`${product.name} 임시 저장 목록에서 삭제`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-[background-color,color,transform] duration-[var(--duration-press)] [transition-timing-function:var(--ease-press)] hover:bg-red-500/10 hover:text-red-300 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70"><Trash2 className="h-4 w-4" /></button></div>)}
        </section>}
      </div>
    </main>
  );
}
