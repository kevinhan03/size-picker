"use client";

import { ArrowRight, Star, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "../contexts/AuthContext";
import { useDigboxContext } from "../contexts/DigboxContext";
import { useLocaleContext } from "../contexts/LocaleContext";
import { captureEvent } from "../utils/analytics";
import { buildLoginHref, saveAuthContinuation } from "../utils/authNavigation";
import { requestGuestDigboxImport } from "../utils/guestDigbox";
import {
  computeTasteSummary,
  getEffectiveStyleTags,
  normalizeStyleTags,
  styleTagLabel,
} from "../utils/tasteGraph";
import { ProgressiveImage } from "./ProgressiveImage";
import type { Product, StyleTagName } from "../types";

const getCurrentPath = () =>
  typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}${window.location.hash}`;

function getProductStyleShares(product: Product) {
  const tags = normalizeStyleTags(getEffectiveStyleTags(product).tags);
  const entries = (Object.entries(tags) as Array<[StyleTagName, number]>).filter(([, score]) => Number.isFinite(score) && score > 0);
  const topEntries = entries.sort((left, right) => right[1] - left[1]).slice(0, 2);
  const total = topEntries.reduce((sum, [, score]) => sum + score, 0);
  if (!total) return [];

  return topEntries
    .map(([tag, score]) => ({ tag, share: Math.round((score / total) * 100) }))
    .sort((left, right) => right.share - left.share);
}

function getTasteShares(products: Product[]) {
  const totals = new Map<StyleTagName, number>();

  for (const product of products) {
    for (const { tag, share } of getProductStyleShares(product)) {
      totals.set(tag, (totals.get(tag) || 0) + share);
    }
  }

  const total = Array.from(totals.values()).reduce((sum, share) => sum + share, 0);
  if (!total) return [];

  return Array.from(totals, ([tag, share]) => ({ tag, share: Math.round((share / total) * 100) }))
    .sort((left, right) => right.share - left.share);
}

export function GuestDigboxExperience() {
  const { t } = useLocaleContext();
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuthContext();
  const digbox = useDigboxContext();
  const viewedPromptRef = useRef(false);
  const isPanelOpen = digbox.isGuestPanelOpen;

  const summary = useMemo(() => computeTasteSummary(digbox.guestProducts), [digbox.guestProducts]);
  const tasteShares = useMemo(() => getTasteShares(digbox.guestProducts), [digbox.guestProducts]);
  const productStyleShares = useMemo(
    () => new Map(digbox.guestProducts.map((product) => [product.id, getProductStyleShares(product)])),
    [digbox.guestProducts]
  );
  const tasteSignals = tasteShares.slice(0, 3);
  const otherTasteShare = Math.max(0, 100 - tasteSignals.reduce((sum, signal) => sum + signal.share, 0));

  useEffect(() => {
    if (digbox.isGuestPromptOpen && digbox.guestCount === digbox.guestLimit && !viewedPromptRef.current) {
      viewedPromptRef.current = true;
      captureEvent("guest_taste_preview_ready", {
        guest_count: digbox.guestCount,
        source: "digging",
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
  if (pathname === "/login" || pathname === "/saved" || auth.authUser || (digbox.guestCount === 0 && !isPanelOpen)) return null;

  const close = () => {
    digbox.setIsGuestPanelOpen(false);
    digbox.setIsGuestPromptOpen(false);
  };

  const startSignup = () => {
    close();
    const returnTo = getCurrentPath();
    // Mark this before leaving the page so both a new sign-up and an existing
    // account login import the three guest selections after authentication.
    requestGuestDigboxImport();
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
        onClick={() => router.push("/saved")}
        className="guest-digbox-progress-button fixed bottom-[calc(var(--app-bottom-nav-height)+1rem+env(safe-area-inset-bottom))] left-1/2 z-[82] flex -translate-x-1/2 items-center gap-2 rounded-full border border-orange-400/30 bg-[#141416]/95 px-4 py-2.5 text-sm font-extrabold text-orange-300 shadow-[0_14px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-[transform,border-color,background-color] duration-[var(--duration-press)] hover:border-orange-300/60 hover:bg-[#1b1b1e] sm:bottom-[1.25rem]"
      >
        <Star className="h-4 w-4 fill-current" />
        {digbox.isGuestPromptOpen || digbox.guestCount === digbox.guestLimit
          ? t("guestTaste.preview")
          : t("guestTaste.selectedItems", { count: digbox.guestCount, limit: digbox.guestLimit })}
      </button>

      {isPanelOpen && (
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
              aria-label={t("guestTaste.close")}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-500 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <p className="text-[11px] font-black tracking-[0.12em] text-yellow-400">{t("guestTaste.tempSavedCount", { count: digbox.guestCount, limit: digbox.guestLimit })}</p>
            <h2 id="guest-digbox-title" className="mt-2 pr-10 text-xl font-black">
              {digbox.guestCount === 0
                ? t("guestTaste.chooseThree")
                : digbox.guestCount === digbox.guestLimit
                  ? t("guestTaste.visible")
                  : t("guestTaste.collecting")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              {digbox.guestCount === 0
                ? t("guestTaste.chooseThreeHelp")
                : digbox.guestCount === digbox.guestLimit
                  ? t("guestTaste.visibleHelp")
                  : t("guestTaste.collectingHelp")}
            </p>

            {digbox.guestCount === digbox.guestLimit && (
              <section className="mt-5 rounded-2xl border border-sky-400/20 bg-sky-400/[0.07] p-4" aria-label={t("guestTaste.myStyleHeading")}>
                <p className="text-xs font-black text-sky-300">{t("guestTaste.myStyleHeading")}</p>
                {digbox.guestProducts.length === digbox.guestCount && tasteSignals.length ? (
                  <>
                    <p className="mt-2 text-lg font-black leading-snug text-white">
                      {t("guestTaste.dominantStyle", { tag: styleTagLabel(tasteSignals[0].tag) })}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-sky-100/80">
                      {t("guestTaste.styleBreakdownHint")}
                    </p>
                    <div className="mt-4 space-y-3">
                      {tasteSignals.map((signal) => (
                        <div key={signal.tag}>
                          <div className="flex items-baseline justify-between gap-3 text-xs">
                            <span className="font-black text-white">{styleTagLabel(signal.tag)}</span>
                            <span className="shrink-0 font-bold text-sky-200">{signal.share}%</span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sky-100/10">
                            <div
                              className="h-full rounded-full bg-sky-300 transition-[width] duration-500"
                              style={{ width: `${signal.share}%` }}
                              aria-label={t("guestTaste.styleShareAria", { tag: styleTagLabel(signal.tag), share: signal.share })}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {otherTasteShare > 0 && <p className="mt-3 text-xs font-semibold text-sky-100/60">{t("guestTaste.otherStyleShare", { share: otherTasteShare })}</p>}
                  </>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">{digbox.guestProducts.length < digbox.guestCount ? t("guestTaste.loadingStyleTags") : t("guestTaste.styleTagsUnavailable")}</p>
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
                    {productStyleShares.get(product.id)?.length ? (
                      <p className="mt-1 truncate text-xs font-semibold text-sky-200">
                        {productStyleShares.get(product.id)!.map(({ tag, share }) => `${styleTagLabel(tag)} ${share}%`).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => digbox.removeGuestItem(product.id)}
                    aria-label={t("guestTaste.remove", { product: product.name })}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-600 transition-[background-color,color,transform] hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {digbox.guestCount === digbox.guestLimit && (
              <p className="mt-5 text-center text-xs font-semibold leading-5 text-gray-400">{t("guestTaste.firstAnalysisSummary")}</p>
            )}

            <button
              type="button"
              onClick={digbox.guestCount === digbox.guestLimit ? startSignup : close}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-4 py-3.5 text-sm font-black text-black transition hover:bg-yellow-300"
            >
              {digbox.guestCount === digbox.guestLimit ? t("guestTaste.saveThreeWithSignup") : t("guestTaste.continue")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        </div>
      )}
    </>
  );
}
