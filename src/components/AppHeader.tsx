"use client";

import {
  ArrowLeft,
  GalleryVerticalEnd,
  LogIn,
  Plus,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "../contexts/AuthContext";
import { useProductFormContext } from "../contexts/ProductFormContext";
import { useNavigationProgress } from "../contexts/NavigationProgressContext";
import { useLocaleContext } from "../contexts/LocaleContext";
import { getAlternateLocale } from "../i18n/locale";
import {
  getPrimaryNavigationDestination,
  primaryNavigationItems,
  type PrimaryNavigationDestination,
} from "./primaryNavigation";

export function AppHeader({
  variant = "full",
}: {
  variant?: "full" | "minimal";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuthContext();
  const productForm = useProductFormContext();
  const { startNavigation } = useNavigationProgress();
  const { locale, setLocale, t } = useLocaleContext();
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [isIconOnlyActions, setIsIconOnlyActions] = useState(false);
  const [hiddenOnCompact, setHiddenOnCompact] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const media = window.matchMedia("(max-width: 1023px)");
    const narrowActionsMedia = window.matchMedia("(max-width: 640px)");
    const updateViewport = () => {
      setIsCompactViewport(media.matches);
      setIsIconOnlyActions(narrowActionsMedia.matches);
      if (!media.matches) setHiddenOnCompact(false);
    };
    const onScroll = () => {
      const nextY = window.scrollY;
      if (!media.matches || nextY <= 8) setHiddenOnCompact(false);
      else if (nextY > lastY) setHiddenOnCompact(true);
      else if (nextY < lastY) setHiddenOnCompact(false);
      lastY = nextY;
    };
    updateViewport();
    window.addEventListener("scroll", onScroll, { passive: true });
    media.addEventListener("change", updateViewport);
    narrowActionsMedia.addEventListener("change", updateViewport);
    return () => {
      window.removeEventListener("scroll", onScroll);
      media.removeEventListener("change", updateViewport);
      narrowActionsMedia.removeEventListener("change", updateViewport);
    };
  }, []);

  const isAdmin = pathname.startsWith("/admin");
  const activeDestination = getPrimaryNavigationDestination(pathname);
  const isMyPage = pathname === "/mypage";
  const compactActions = isIconOnlyActions;
  const headerFrameClass = isCompactViewport
    ? "h-[calc(4rem+env(safe-area-inset-top))] w-full max-w-[calc(70rem+var(--app-main-px)+var(--app-main-px))] px-[var(--app-main-px)] pt-[env(safe-area-inset-top)]"
    : "h-16 w-full max-w-[calc(70rem+var(--app-main-px)+var(--app-main-px))] px-[var(--app-main-px)]";

  function navigate(destination: PrimaryNavigationDestination) {
    if (activeDestination === destination) return;
    startNavigation();
    if (destination === "digging") {
      router.push("/");
      return;
    }
    if (destination === "outfits") {
      router.push("/outfits");
      return;
    }
    if (destination === "taste") {
      router.push("/taste");
      return;
    }
    if (destination === "closet") {
      router.push("/closet");
      return;
    }
    if (destination === "outfit-explorer") {
      router.push("/outfit-explorer");
      return;
    }
    if (!auth.authUser) {
      router.push("/saved");
      return;
    }
    router.push(
      auth.dbUsername ? `/u/${encodeURIComponent(auth.dbUsername)}` : "/mypage"
    );
  }

  function openProductForm() {
    if (!auth.authUser) {
      router.push("/login");
      return;
    }
    productForm.openModal();
  }

  const alternateLocale = getAlternateLocale(locale);
  const alternateLocaleLabel = alternateLocale === "en" ? "English" : "한국어";

  function changeGuestLocale() {
    void setLocale(alternateLocale);
  }

  const desktopNavClass = (active: boolean) =>
    `flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 transition ${
      active
        ? "bg-orange-500/15 text-orange-300"
        : "text-gray-400 hover:bg-white/[0.06] hover:text-white"
    }`;
  const tooltipClass =
    "pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#111114] px-2.5 py-1 text-xs font-semibold text-white opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-[opacity,transform] duration-150 ease-out scale-95 group-hover:delay-300 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:delay-0 group-focus-visible:scale-100 group-focus-visible:opacity-100";

  if (variant === "minimal") {
    return (
      <header className="app-header-motion pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center border-b border-white/[0.08] bg-black/80 backdrop-blur-xl transition-transform duration-[var(--duration-popover)] [transition-timing-function:var(--ease-out)] motion-reduce:transition-none">
        <div
          className={`pointer-events-auto flex items-center justify-between ${headerFrameClass}`}
        >
          <Link
            href="/"
            aria-label={t("header.home")}
            className="flex min-w-0 items-center gap-2 rounded-xl text-base font-bold tracking-tight text-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <Image
              src="/digbox-mark.png"
              alt=""
              width={40}
              height={40}
              className="h-8 w-8 object-contain lg:h-9 lg:w-9"
            />
            <span className="font-bold tracking-tight">DIGBOX</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-semibold text-gray-300 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.06] hover:text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 motion-reduce:transform-none motion-reduce:transition-none"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("header.goHome")}
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`app-header-motion pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center border-b border-white/[0.08] bg-black/80 backdrop-blur-xl transition-transform duration-[var(--duration-popover)] [transition-timing-function:var(--ease-out)] ${hiddenOnCompact ? "-translate-y-full" : "translate-y-0"}`}
    >
      <div
        className={`pointer-events-auto flex items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr] ${headerFrameClass}`}
      >
        <div className="flex min-w-0 items-center">
          <div
            role="link"
            tabIndex={0}
            aria-label={t("header.home")}
            onClick={() => {
              if (pathname !== "/") startNavigation();
              router.push("/");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (pathname !== "/") startNavigation();
                router.push("/");
              }
            }}
            className="flex min-w-0 cursor-pointer items-center gap-2 rounded-xl"
          >
            <span className="flex h-8 w-8 items-center justify-center lg:h-9 lg:w-9">
              <Image
                src="/digbox-mark.png"
                alt=""
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </span>
            <span className="flex min-w-0 flex-col text-left leading-none">
              <span className="font-bold tracking-tight text-orange-500">
                DIGBOX
              </span>
            </span>
          </div>
        </div>

        {!isAdmin && (
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-1 lg:flex"
          >
            {primaryNavigationItems.map(
              ({ destination, labelKey, icon: Icon }) => (
                <button
                  key={destination}
                  type="button"
                  aria-current={
                    activeDestination === destination ? "page" : undefined
                  }
                  aria-label={t(labelKey)}
                  onClick={() => navigate(destination)}
                  className={desktopNavClass(activeDestination === destination)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-bold">{t(labelKey)}</span>
                </button>
              )
            )}
            <button
              type="button"
              aria-current={
                activeDestination === "outfit-explorer" ? "page" : undefined
              }
              aria-label={t("nav.outfitExplorer")}
              onClick={() => navigate("outfit-explorer")}
              className={desktopNavClass(
                activeDestination === "outfit-explorer"
              )}
            >
              <GalleryVerticalEnd className="h-5 w-5" />
              <span className="text-xs font-bold">
                {t("nav.outfitExplorer")}
              </span>
            </button>
          </nav>
        )}

        {!isAdmin && (
          <div
            className={`flex items-center justify-end ${compactActions ? "gap-0" : "gap-1"}`}
          >
            <div className="group relative">
              <button
                type="button"
                onClick={openProductForm}
                aria-label={t("header.addProduct")}
                className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg px-2 text-gray-400 transition-[width,background-color,color] duration-150 ease-out hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 ${compactActions ? "h-11 w-11 px-0" : "h-10 w-[4.5rem]"}`}
              >
                <Plus className="h-4 w-4" />
                <span
                  className={`overflow-hidden whitespace-nowrap text-xs font-bold transition-[max-width,margin,opacity] duration-[var(--duration-popover)] ease-out ${compactActions ? "ml-0 max-w-0 opacity-0" : "ml-1 max-w-10 opacity-100"}`}
                >
                  {t("header.product")}
                </span>
              </button>
              <div className={tooltipClass}>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#111114]" />
                {t("header.addProduct")}
              </div>
            </div>
            {auth.isAuthLoading ? (
              <span
                aria-label={t("header.checkingAccount")}
                className={`flex items-center justify-center rounded-lg ${compactActions ? "h-11 w-11" : "h-10 w-10"}`}
              >
                <span
                  className="h-4 w-4 rounded-full bg-white/[0.12] animate-pulse motion-reduce:animate-none"
                  aria-hidden="true"
                />
              </span>
            ) : auth.authUser ? (
              <div className="group relative">
                <button
                  type="button"
                  aria-label={t("header.myPage")}
                  onClick={() => router.push("/mypage")}
                  className={`flex items-center justify-center rounded-lg text-gray-400 transition-[background-color,color] duration-150 ease-out hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 ${compactActions ? "h-11 w-11" : "h-10 w-10"} ${isMyPage ? "bg-orange-500/[0.08] text-orange-300" : ""}`}
                >
                  <UserRound className="h-4 w-4" />
                </button>
                <div className={tooltipClass}>
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#111114]" />
                  {t("header.myPage")}
                </div>
              </div>
            ) : (
              <>
                <div className="group relative">
                  <button
                    type="button"
                    aria-label={t("header.login")}
                    onClick={() => router.push("/login")}
                    className={`flex items-center justify-center rounded-lg text-gray-400 transition-[background-color,color] duration-150 ease-out hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 ${compactActions ? "h-11 w-11" : "h-10 w-10"}`}
                  >
                    <LogIn className="h-4 w-4" />
                  </button>
                  <div className={tooltipClass}>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#111114]" />
                    {t("header.login")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={changeGuestLocale}
                  aria-label={t("header.changeLanguage", {
                    language: alternateLocaleLabel,
                  })}
                  title={t("header.changeLanguage", {
                    language: alternateLocaleLabel,
                  })}
                  className={`flex shrink-0 items-center justify-center rounded-lg text-gray-400 transition-[background-color,color,transform] duration-150 ease-out hover:bg-white/[0.06] hover:text-white active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 motion-reduce:transform-none ${compactActions ? "h-11 w-11" : "h-10 w-10"}`}
                >
                  <Image
                    src="/icons/language-globe-white.png"
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5 object-contain"
                  />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
