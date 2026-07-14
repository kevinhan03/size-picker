"use client";

import { ArrowRight, Star, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../contexts/AuthContext";
import { useDigboxContext } from "../contexts/DigboxContext";
import { captureEvent } from "../utils/analytics";
import { buildLoginHref, saveAuthContinuation } from "../utils/authNavigation";
import { computeTasteSummary } from "../utils/tasteGraph";
import { ProgressiveImage } from "./ProgressiveImage";

const getCurrentPath = () =>
  typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}${window.location.hash}`;

export function GuestDigboxExperience() {
  const router = useRouter();
  const auth = useAuthContext();
  const digbox = useDigboxContext();
  const viewedPromptRef = useRef(false);
  const isOpen = digbox.isGuestPanelOpen || digbox.isGuestPromptOpen;

  const summary = useMemo(() => computeTasteSummary(digbox.guestProducts), [digbox.guestProducts]);
  const topTaste = summary.entries.slice(0, 2);
  const fallback = useMemo(() => {
    const brands = [...new Set(digbox.guestProducts.map((product) => product.brand).filter(Boolean))].slice(0, 2);
    const categories = [...new Set(digbox.guestProducts.map((product) => product.category).filter(Boolean))].slice(0, 2);
    return { brands, categories };
  }, [digbox.guestProducts]);

  useEffect(() => {
    if (digbox.isGuestPromptOpen && digbox.guestCount === digbox.guestLimit && !viewedPromptRef.current) {
      viewedPromptRef.current = true;
      captureEvent("guest_taste_preview_viewed", {
        guest_count: digbox.guestCount,
        tagged_count: summary.taggedCount,
      });
    }
    if (!digbox.isGuestPromptOpen) viewedPromptRef.current = false;
  }, [digbox.guestCount, digbox.guestLimit, digbox.isGuestPromptOpen, summary.taggedCount]);

  if (auth.authUser || (digbox.guestCount === 0 && !isOpen)) return null;

  const close = () => {
    digbox.setIsGuestPanelOpen(false);
    digbox.setIsGuestPromptOpen(false);
  };

  const startSignup = () => {
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
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 z-[82] hidden -translate-x-1/2 items-center gap-2 rounded-full border border-yellow-400/30 bg-[#15140f]/95 px-4 py-2.5 text-sm font-black text-yellow-300 shadow-[0_14px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl transition hover:border-yellow-300/60 hover:bg-[#201e12] sm:flex"
      >
        <Star className="h-4 w-4 fill-current" />
        임시 DIGBOX {digbox.guestCount}/{digbox.guestLimit}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[105] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-digbox-title"
            className="relative max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#141416] p-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.65)] sm:max-w-md sm:rounded-3xl sm:p-6"
          >
            <button
              type="button"
              onClick={close}
              aria-label="임시 DIGBOX 닫기"
              className="absolute right-4 top-4 rounded-full p-2 text-gray-500 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-yellow-400">Temporary DIGBOX</p>
            <h2 id="guest-digbox-title" className="mt-2 pr-10 text-xl font-black">
              {digbox.guestCount === 0
                ? "상품을 담아 관심 취향을 만들어보세요"
                : digbox.guestCount === digbox.guestLimit
                  ? "관심 취향이 보이기 시작했어요"
                  : "마음에 든 상품을 모으고 있어요"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              {digbox.guestCount === 0
                ? "마음에 드는 상품의 별을 눌러 임시 DIGBOX에 담을 수 있어요."
                : "지금은 이 브라우저에만 저장돼요. 가입하면 내 DIGBOX에 안전하게 보관할 수 있어요."}
            </p>

            <div className="mt-5 space-y-2">
              {digbox.guestProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-2.5">
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
                    aria-label={`${product.name} 임시 DIGBOX에서 삭제`}
                    className="rounded-xl p-2 text-gray-600 transition hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {digbox.guestCount === digbox.guestLimit && (
              <div className="mt-5 rounded-2xl border border-sky-400/20 bg-sky-400/[0.07] p-4">
                <p className="text-xs font-black text-sky-300">관심 취향 미리보기</p>
                {topTaste.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {topTaste.map((entry) => (
                      <span key={entry.tag} className="rounded-full bg-white/[0.08] px-3 py-1.5 text-xs font-bold capitalize text-white">
                        {entry.tag} {Math.round(entry.percent)}%
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">
                    {fallback.brands.length ? `관심 브랜드 · ${fallback.brands.join(" · ")}` : `담은 상품 ${digbox.guestCount}개`}
                    {fallback.categories.length ? ` / ${fallback.categories.join(" · ")}` : ""}
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={digbox.guestCount === 0 ? () => { close(); router.push("/"); } : startSignup}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-4 py-3.5 text-sm font-black text-black transition hover:bg-yellow-300"
            >
              {digbox.guestCount === 0 ? "상품 둘러보기" : "가입하고 내 DIGBOX에 저장"}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={close}
              className="mt-2 w-full py-2 text-xs font-bold text-gray-500 transition hover:text-gray-300"
            >
              계속 둘러보기
            </button>
          </section>
        </div>
      )}
    </>
  );
}
