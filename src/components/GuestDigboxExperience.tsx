"use client";

import { ArrowRight, Star, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "../contexts/AuthContext";
import { useDigboxContext } from "../contexts/DigboxContext";
import { useLocaleContext } from "../contexts/LocaleContext";
import { captureEvent } from "../utils/analytics";
import { buildLoginHref, saveAuthContinuation } from "../utils/authNavigation";
import {
  computeTasteSummary,
  getEffectiveStyleTags,
  normalizeStyleTags,
  selectTopTags,
  tagColor,
} from "../utils/tasteGraph";
import { ProgressiveImage } from "./ProgressiveImage";

const getCurrentPath = () =>
  typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}${window.location.hash}`;

const formatTag = (tag: string) => tag.replace(/_/g, " ");

export function GuestDigboxExperience() {
  const { t } = useLocaleContext();
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuthContext();
  const digbox = useDigboxContext();
  const viewedPromptRef = useRef(false);
  const isOpen = digbox.isGuestPanelOpen || digbox.isGuestPromptOpen;

  const summary = useMemo(() => computeTasteSummary(digbox.guestProducts), [digbox.guestProducts]);
  const topTaste = summary.entries.slice(0, 3);
  const tasteHeadline = topTaste
    .slice(0, 2)
    .map((entry) => formatTag(entry.tag))
    .join(" × ");
  const productTaste = useMemo(
    () =>
      digbox.guestProducts.map((product) => ({
        product,
        tags: selectTopTags(normalizeStyleTags(getEffectiveStyleTags(product).tags), 2, {
          enforceSecondThreshold: false,
        }),
      })),
    [digbox.guestProducts]
  );
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
        className="fixed bottom-[calc(var(--app-bottom-nav-height)+1rem+env(safe-area-inset-bottom))] left-1/2 z-[82] flex -translate-x-1/2 items-center gap-2 rounded-full border border-yellow-400/30 bg-[#15140f]/95 px-4 py-2.5 text-sm font-black text-yellow-300 shadow-[0_14px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl transition hover:border-yellow-300/60 hover:bg-[#201e12] sm:bottom-[1.25rem]"
      >
        <Star className="h-4 w-4 fill-current" />
        {digbox.guestCount === digbox.guestLimit
          ? t("guestTaste.preview")
          : t("guestTaste.selectedItems", { count: digbox.guestCount, limit: digbox.guestLimit })}
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
              aria-label={t("guestTaste.close")}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-500 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-yellow-400">Temporary saved items</p>
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
                    aria-label={t("guestTaste.remove", { product: product.name })}
                    className="rounded-xl p-2 text-gray-600 transition hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {digbox.guestCount === digbox.guestLimit && (
              <div className="mt-5 rounded-2xl border border-sky-400/20 bg-sky-400/[0.07] p-4">
                <p className="text-xs font-black text-sky-300">{t("guestTaste.preview")}</p>
                {topTaste.length ? (
                  <div className="mt-3">
                    <p className="text-lg font-black capitalize text-white">{tasteHeadline}</p>

                    <div className="mt-4 space-y-2.5">
                      {topTaste.map((entry) => {
                        const colors = tagColor(entry.tag);
                        return (
                          <div key={entry.tag} className="grid grid-cols-[92px_1fr_36px] items-center gap-2 text-xs">
                            <span className="truncate font-bold capitalize text-white">{formatTag(entry.tag)}</span>
                            <span className="h-2 overflow-hidden rounded-full bg-white/10">
                              <span
                                className="block h-full rounded-full"
                                style={{ width: `${entry.percent}%`, backgroundColor: colors.bright }}
                              />
                            </span>
                            <span className="text-right font-black text-sky-200">{Math.round(entry.percent)}%</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-5 border-t border-white/10 pt-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">{t("guestTaste.itemTags")}</p>
                      <div className="mt-2.5 space-y-2">
                        {productTaste.map(({ product, tags }) => (
                          <div key={product.id} className="rounded-xl bg-black/20 px-3 py-2.5">
                            <p className="truncate text-xs font-bold text-white">{product.name}</p>
                            {tags.length ? (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {tags.map(([tag, score]) => {
                                  const colors = tagColor(tag);
                                  return (
                                    <span
                                      key={tag}
                                      className="rounded-full border px-2 py-1 text-[10px] font-bold capitalize"
                                      style={{
                                        borderColor: `${colors.bright}66`,
                                        color: colors.bright,
                                        backgroundColor: `${colors.base}18`,
                                      }}
                                    >
                                      {formatTag(tag)} {Math.round(score * 100)}%
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="mt-1 text-[11px] text-gray-400">{product.brand} · {product.category}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">
                    {fallback.brands.length ? t("guestTaste.brandsFallback", { brands: fallback.brands.join(" · ") }) : t("guestTaste.countFallback", { count: digbox.guestCount })}
                    {fallback.categories.length ? ` / ${fallback.categories.join(" · ")}` : ""}
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={digbox.guestCount === digbox.guestLimit ? startSignup : close}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-4 py-3.5 text-sm font-black text-black transition hover:bg-yellow-300"
            >
              {digbox.guestCount === digbox.guestLimit ? t("guestTaste.saveWithSignup") : t("guestTaste.continue")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        </div>
      )}
    </>
  );
}
