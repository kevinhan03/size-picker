"use client";

import { ArrowRight, Star, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "../contexts/AuthContext";
import { useDigboxContext } from "../contexts/DigboxContext";
import { captureEvent } from "../utils/analytics";
import { buildLoginHref, saveAuthContinuation } from "../utils/authNavigation";
import {
  computeTasteSummary,
  describeTasteCollection,
  getEffectiveStyleTags,
  normalizeStyleTags,
  selectTopTags,
  styleTagLabel,
} from "../utils/tasteGraph";
import { ProgressiveImage } from "./ProgressiveImage";

const getCurrentPath = () =>
  typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}${window.location.hash}`;

export function GuestDigboxExperience() {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuthContext();
  const digbox = useDigboxContext();
  const viewedPromptRef = useRef(false);
  const isOpen = digbox.isGuestPanelOpen || digbox.isGuestPromptOpen;

  const summary = useMemo(() => computeTasteSummary(digbox.guestProducts), [digbox.guestProducts]);
  const topTaste = summary.entries.slice(0, 3);
  const interpretation = useMemo(
    () => describeTasteCollection(digbox.guestProducts, summary),
    [digbox.guestProducts, summary]
  );
  const tasteHeadline = topTaste
    .slice(0, 2)
    .map((entry) => styleTagLabel(entry.tag))
    .join(" · ");
  const repeatedTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of digbox.guestProducts) {
      const tags = selectTopTags(normalizeStyleTags(getEffectiveStyleTags(product).tags), 2, { enforceSecondThreshold: false });
      for (const [tag] of tags) counts.set(tag, (counts.get(tag) || 0) + 1);
    }
    return [...counts.entries()]
      .filter(([, count]) => count >= 2)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([tag, count]) => ({ label: styleTagLabel(tag as Parameters<typeof styleTagLabel>[0]), count }));
  }, [digbox.guestProducts]);
  const moodTags = repeatedTags.length
    ? repeatedTags.slice(0, 2)
    : topTaste.slice(0, 2).map((entry) => ({
      label: styleTagLabel(entry.tag),
      count: 0,
    }));
  const strongestRepeatedCount = repeatedTags[0]?.count ?? 0;

  useEffect(() => {
    if (digbox.isGuestPromptOpen && digbox.guestCount === digbox.guestLimit && !viewedPromptRef.current) {
      viewedPromptRef.current = true;
      captureEvent("save_login_gate_shown", {
        guest_count: digbox.guestCount,
        source: "guest_digbox_preview",
      });
      captureEvent("guest_taste_preview_viewed", {
        guest_count: digbox.guestCount,
        tagged_count: summary.taggedCount,
      });
    }
    if (!digbox.isGuestPromptOpen) viewedPromptRef.current = false;
  }, [digbox.guestCount, digbox.guestLimit, digbox.isGuestPromptOpen, summary.taggedCount]);

  // Keep the authentication screen focused on completing sign-up. The saved
  // items are synced automatically once the account is ready.
  if (pathname === "/login" || auth.authUser || (digbox.guestCount === 0 && !isOpen)) return null;

  const close = () => {
    digbox.setIsGuestPanelOpen(false);
    digbox.setIsGuestPromptOpen(false);
  };

  const startSignup = () => {
    close();
    const returnTo = getCurrentPath();
    saveAuthContinuation({ intent: "signup", returnTo, source: "guest_digbox" });
    captureEvent("auth_started", {
      mode: "signup",
      source: "guest_digbox",
      method: "undecided",
      guest_count: digbox.guestCount,
      stage: "cta",
    });
    router.push(buildLoginHref("signup", returnTo));
  };

  return (
    <>
      <button
        type="button"
        onClick={() => digbox.setIsGuestPanelOpen(true)}
        className="guest-digbox-progress-button fixed bottom-[calc(var(--app-bottom-nav-height)+1rem+env(safe-area-inset-bottom))] left-1/2 z-[82] flex -translate-x-1/2 items-center gap-2 rounded-full border border-yellow-400/30 bg-[#15140f]/95 px-4 py-2.5 text-sm font-black text-yellow-300 shadow-[0_14px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-[transform,border-color,background-color] duration-[var(--duration-press)] hover:border-yellow-300/60 hover:bg-[#201e12] sm:bottom-[1.25rem]"
      >
        <Star className="h-4 w-4 fill-current" />
        {digbox.guestCount === digbox.guestLimit
          ? "내 취향 미리보기"
          : `취향 만들기 ${digbox.guestCount}/${digbox.guestLimit}`}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[105] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-digbox-title"
            data-scroll-lock-allow
            className="relative max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#141416] p-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.65)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:max-w-md sm:rounded-3xl sm:p-6"
          >
            <button
              type="button"
              onClick={close}
              aria-label="임시 저장 목록 닫기"
              className="absolute right-4 top-4 rounded-full p-2 text-gray-500 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <p className="text-[11px] font-black tracking-[0.12em] text-yellow-400">임시 저장 · {digbox.guestCount}/{digbox.guestLimit}</p>
            <h2 id="guest-digbox-title" className="mt-2 pr-10 text-xl font-black">
              {digbox.guestCount === 0
                ? "마음에 드는 아이템을 3개 골라보세요"
                : digbox.guestCount === digbox.guestLimit
                  ? "당신의 첫 DIG 결과"
                  : "마음에 든 상품을 모으고 있어요"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              {digbox.guestCount === 0
                ? "상품 카드의 별을 눌러 관심 있는 아이템을 담아보세요."
                : digbox.guestCount === digbox.guestLimit
                  ? "세 상품에서 반복된 스타일 코드를 찾았어요."
                  : "고른 아이템으로 취향을 만들고 있어요. 3개가 되면 공통 무드를 보여드려요."}
            </p>

            {digbox.guestCount === digbox.guestLimit && (
              <section className="mt-5 rounded-2xl border border-sky-400/20 bg-sky-400/[0.07] p-4" aria-label="첫 DIG 결과">
                <p className="text-xs font-black text-sky-300">스타일 무드</p>
                {digbox.guestProducts.length === digbox.guestCount && topTaste.length ? (
                  <>
                    <p className="mt-2 text-lg font-black leading-snug text-white">
                      {interpretation?.title || `${tasteHeadline} 무드`}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-sky-100/80">
                      {strongestRepeatedCount >= 2
                        ? `고른 ${digbox.guestCount}개 중 ${strongestRepeatedCount}개에서 반복된 무드예요.`
                        : "고른 상품에서 공통된 스타일을 찾았어요."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {moodTags.map(({ label }) => (
                        <span key={label} className="rounded-full border border-sky-300/25 bg-sky-300/[0.08] px-2.5 py-1.5 text-xs font-bold text-sky-100">
                          {label}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">{digbox.guestProducts.length < digbox.guestCount ? "스타일 태그를 불러오는 중이에요." : "스타일 태그가 없는 상품이 있어 무드를 정리하지 못했어요."}</p>
                )}
              </section>
            )}

            <div className="mt-5 space-y-2">
              {digbox.guestProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.055] bg-white/[0.025] p-2.5">
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-white/[0.05]">
                    <ProgressiveImage
                      src={product.thumbnailImage || product.image}
                      thumbnailSrc={product.thumbnailImage}
                      alt={product.name}
                      className="object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-black uppercase tracking-wide text-orange-400">{product.brand}</p>
                    <p className="truncate text-sm font-bold text-white">{product.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => digbox.removeGuestItem(product.id)}
                    aria-label={`${product.name} 임시 저장 목록에서 삭제`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-600 transition-[background-color,color,transform] hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {digbox.guestCount === digbox.guestLimit && (
              <p className="mt-5 text-center text-xs font-semibold leading-5 text-gray-400">지금은 첫 발견이에요. 가입하면 저장한 상품이 쌓일수록 색·소재·실루엣까지 반영한 취향 그래프로 이어져요.</p>
            )}

            <button
              type="button"
              onClick={digbox.guestCount === digbox.guestLimit ? startSignup : close}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-4 py-3.5 text-sm font-black text-black transition hover:bg-yellow-300"
            >
              {digbox.guestCount === digbox.guestLimit ? "가입하고 이 취향 이어가기" : "계속 둘러보기"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        </div>
      )}
    </>
  );
}
