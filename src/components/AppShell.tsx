"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AppHeader } from "./AppHeader";
import { ClosetIcon } from "./icons/ClosetIcon";
import { GuestDigboxExperience } from "./GuestDigboxExperience";
import { MobileBottomNav } from "./MobileBottomNav";
import { useAuthContext } from "../contexts/AuthContext";
import { useClosetContext } from "../contexts/ClosetContext";
import { useDigboxContext } from "../contexts/DigboxContext";
import { useProductFormContext } from "../contexts/ProductFormContext";
import { useSearchContext } from "../contexts/SearchContext";
import { useLocaleContext } from "../contexts/LocaleContext";
import { readAuthContinuation, saveAuthContinuation } from "../utils/authNavigation";
import { MOTION_DURATION_MS } from "../utils/motion";

const SIGNUP_VERIFIED_TOAST_KEY = "digbox_signup_verified_toast";
const GOOGLE_SIGNUP_TOAST_KEY = "digbox_google_signup_complete_toast";

function GoogleSignupWelcomeToast() {
  const pathname = usePathname();
  const { t } = useLocaleContext();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/onboarding")) return;
    if (sessionStorage.getItem(GOOGLE_SIGNUP_TOAST_KEY) !== "1") return;
    sessionStorage.removeItem(GOOGLE_SIGNUP_TOAST_KEY);
    setMounted(true);
    requestAnimationFrame(() => setVisible(true));
    const hideTimer = window.setTimeout(() => setVisible(false), 2600);
    const removeTimer = window.setTimeout(
      () => setMounted(false),
      2600 + MOTION_DURATION_MS.layerExit
    );
    return () => { window.clearTimeout(hideTimer); window.clearTimeout(removeTimer); };
  }, [pathname]);

  if (!mounted) return null;
  return <div className="pointer-events-none fixed bottom-[calc(var(--app-bottom-nav-height)+1rem+env(safe-area-inset-bottom))] left-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 sm:bottom-6"><div role="status" className={`rounded-2xl border border-emerald-400/25 bg-[#111114]/95 px-4 py-3 text-center text-sm font-bold text-white shadow-[0_18px_48px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-[transform,opacity] [transition-timing-function:var(--ease-out)] motion-reduce:transition-opacity motion-reduce:duration-[var(--duration-reduced)] ${visible ? "duration-[var(--duration-layer-enter)] translate-y-0 opacity-100" : "duration-[var(--duration-layer-exit)] translate-y-3 opacity-0 motion-reduce:translate-y-0"}`}>{t("toast.signupWelcome")}</div></div>;
}

const AddProductModal = dynamic(
  () => import("./AddProductModal").then((mod) => mod.AddProductModal),
  { ssr: false }
);
const SearchResultOverlay = dynamic(
  () => import("./SearchResultOverlay").then((mod) => mod.SearchResultOverlay),
  { ssr: false }
);

function ClosetToast() {
  const { toast, clearToast } = useClosetContext();
  const { t } = useLocaleContext();
  const [visibleToast, setVisibleToast] = useState(toast);
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasVisibleToastRef = useRef(false);

  useEffect(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (showTimerRef.current) clearTimeout(showTimerRef.current);

    if (toast) {
      const replayDelay = hasVisibleToastRef.current ? 40 : 0;
      setIsVisible(false);
      showTimerRef.current = setTimeout(() => {
        hasVisibleToastRef.current = true;
        setVisibleToast(toast);
        requestAnimationFrame(() => setIsVisible(true));
      }, replayDelay);

      return () => {
        if (showTimerRef.current) clearTimeout(showTimerRef.current);
      };
    }

    setIsVisible(false);
    hideTimerRef.current = setTimeout(() => {
      hasVisibleToastRef.current = false;
      setVisibleToast(null);
    }, MOTION_DURATION_MS.layerExit);

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, [toast]);

  if (!visibleToast) return null;

  const isLoginRequired = visibleToast.message === "login_required";
  const isAdded = visibleToast.message === "added";

  return (
    <div className="pointer-events-none fixed bottom-[calc(var(--app-bottom-nav-height)+1rem+env(safe-area-inset-bottom))] left-1/2 z-[90] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div
        className={`ui-floating-surface pointer-events-auto flex items-center gap-3 rounded-2xl border border-orange-500/25 bg-[#111114]/95 px-4 py-3 text-sm text-white shadow-[0_18px_48px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-[transform,opacity] [transition-timing-function:var(--ease-out)] motion-reduce:transition-opacity motion-reduce:duration-[var(--duration-reduced)] ${
          isVisible ? "duration-[var(--duration-layer-enter)] translate-y-0 opacity-100" : "duration-[var(--duration-layer-exit)] translate-y-3 opacity-0 motion-reduce:translate-y-0"
        }`}
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
          <ClosetIcon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">
            {isLoginRequired ? t("toast.loginRequired") : isAdded ? t("toast.closetAdded") : t("toast.closetExists")}
          </p>
          <p className="truncate text-xs text-gray-400">
            {isLoginRequired ? t("toast.closetLoginHint") : isAdded ? t("toast.closetAddedHint") : t("toast.closetExistsHint")}
          </p>
        </div>

        {isLoginRequired ? (
          <Link
            href="/login"
            onClick={clearToast}
            className="flex-shrink-0 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-orange-400"
          >
            {t("toast.login")}
          </Link>
        ) : isAdded ? (
          <Link
            href="/closet"
            onClick={clearToast}
            className="flex-shrink-0 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-orange-400"
          >
            {t("toast.view")}
          </Link>
        ) : (
          <button
            type="button"
            onClick={clearToast}
            aria-label={t("toast.close")}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function DigboxToast() {
  const { toast, clearToast, guestCount, retryGuestSync } = useDigboxContext();
  const auth = useAuthContext();
  const router = useRouter();
  const { t } = useLocaleContext();
  const usernameRef = useRef(auth.dbUsername);
  const [visibleToast, setVisibleToast] = useState(toast);
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasVisibleToastRef = useRef(false);

  useEffect(() => {
    usernameRef.current = auth.dbUsername;
  }, [auth.dbUsername]);

  useEffect(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (showTimerRef.current) clearTimeout(showTimerRef.current);

    if (toast) {
      const replayDelay = hasVisibleToastRef.current ? 40 : 0;
      setIsVisible(false);
      showTimerRef.current = setTimeout(() => {
        hasVisibleToastRef.current = true;
        setVisibleToast(toast);
        requestAnimationFrame(() => setIsVisible(true));
      }, replayDelay);

      return () => {
        if (showTimerRef.current) clearTimeout(showTimerRef.current);
      };
    }

    setIsVisible(false);
    hideTimerRef.current = setTimeout(() => {
      hasVisibleToastRef.current = false;
      setVisibleToast(null);
    }, MOTION_DURATION_MS.layerExit);

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, [toast]);

  const handleViewDigbox = useCallback(() => {
    clearToast();
    const username = usernameRef.current;
    if (username) {
      router.push(`/u/${encodeURIComponent(username)}`);
    } else {
      router.push("/mypage");
    }
  }, [clearToast, router]);

  if (!visibleToast) return null;

  const isLoginRequired = visibleToast.message === "login_required";
  const isGuestAdded = visibleToast.message === "guest_added";
  const isAdded = visibleToast.message === "added" || visibleToast.message === "guest_synced" || isGuestAdded;
  const isGuestSyncPartial = visibleToast.message === "guest_sync_partial";

  return (
    <div className={`pointer-events-none fixed bottom-[calc(var(--app-bottom-nav-height)+1rem+env(safe-area-inset-bottom))] left-1/2 z-[90] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 ${guestCount > 0 && !auth.authUser ? "sm:bottom-[calc(5rem+env(safe-area-inset-bottom))]" : "sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]"}`}>
      <div
        className={`ui-floating-surface pointer-events-auto flex items-center gap-3 rounded-2xl border border-yellow-400/25 bg-[#111114]/95 px-4 py-3 text-sm text-white shadow-[0_18px_48px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-[transform,opacity] [transition-timing-function:var(--ease-out)] motion-reduce:transition-opacity motion-reduce:duration-[var(--duration-reduced)] ${
          isVisible ? "duration-[var(--duration-layer-enter)] translate-y-0 opacity-100" : "duration-[var(--duration-layer-exit)] translate-y-3 opacity-0 motion-reduce:translate-y-0"
        }`}
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-400">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill={isAdded ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">
            {isGuestSyncPartial
              ? t("toast.guestSyncPartial")
              : visibleToast.message === "guest_synced"
              ? t("toast.guestSyncedFull")
              : isGuestAdded
              ? t("toast.guestAdded", { count: guestCount })
              : isLoginRequired
              ? t("toast.loginRequired")
              : isAdded
              ? t("toast.saved")
              : t("toast.alreadySaved")}
          </p>
          <p className="truncate text-xs text-gray-400">
            {isGuestSyncPartial
              ? t("toast.guestSyncPartialHint")
              : visibleToast.message === "guest_synced"
              ? t("toast.guestSyncedFullHint")
              : isGuestAdded
              ? guestCount === 1
                ? t("toast.guestOneHint")
                : guestCount === 2
                  ? t("toast.guestTwoHint")
                  : t("toast.guestThreeHint")
              : isLoginRequired
              ? t("toast.saveLoginHint")
              : isAdded
              ? t("toast.savedHint")
              : t("toast.alreadySavedHint")}
          </p>
        </div>

        {isGuestSyncPartial ? (
          <button
            type="button"
            onClick={() => {
              clearToast();
              retryGuestSync();
            }}
            className="flex-shrink-0 rounded-lg bg-red-400 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-red-300"
          >
            {t("common.retry")}
          </button>
        ) : isLoginRequired ? (
          <Link
            href="/login"
            onClick={clearToast}
            className="flex-shrink-0 rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-yellow-300"
          >
            {t("toast.login")}
          </Link>
        ) : isAdded ? (
          <button
            type="button"
            onClick={isGuestAdded ? () => { clearToast(); router.push("/saved"); } : handleViewDigbox}
            className="flex-shrink-0 rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-yellow-300"
          >
            {isGuestAdded ? t("guestTaste.preview") : t("toast.view")}
          </button>
        ) : (
          <button
            type="button"
            onClick={clearToast}
            aria-label={t("toast.close")}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function ProductSubmitToast() {
  const { submitToast, clearSubmitToast } = useProductFormContext();
  const [visibleToast, setVisibleToast] = useState(submitToast);
  const { t } = useLocaleContext();
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);

    if (submitToast) {
      setVisibleToast(submitToast);
      requestAnimationFrame(() => setIsVisible(true));
      clearTimerRef.current = setTimeout(() => clearSubmitToast(), 2600);
      return () => {
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      };
    }

    setIsVisible(false);
    hideTimerRef.current = setTimeout(
      () => setVisibleToast(null),
      MOTION_DURATION_MS.layerExit
    );
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, [clearSubmitToast, submitToast]);

  if (!visibleToast) return null;

  const isError = visibleToast.type === "error";

  return (
    <div className="pointer-events-none fixed left-1/2 top-1/2 z-[95] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2">
      <div
        className={`ui-floating-surface pointer-events-auto flex items-center gap-3 rounded-2xl border bg-[#111114]/95 px-4 py-3 text-sm text-white shadow-[0_18px_48px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-[transform,opacity] [transition-timing-function:var(--ease-out)] motion-reduce:transition-opacity motion-reduce:duration-[var(--duration-reduced)] ${
          isError ? "border-red-500/30" : "border-orange-500/25"
        } ${isVisible ? "duration-[var(--duration-layer-enter)] scale-100 opacity-100" : "duration-[var(--duration-layer-exit)] scale-95 opacity-0 motion-reduce:scale-100"}`}
      >
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${isError ? "bg-red-500/15 text-red-300" : "bg-orange-500/15 text-orange-400"}`}>
          {isError ? "!" : "✓"}
        </div>
        <p className="min-w-0 flex-1 text-sm font-bold text-white">{visibleToast.message}</p>
        <button
          type="button"
          onClick={clearSubmitToast}
          aria-label={t("toast.close")}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function SignupVerifiedToast() {
  const pathname = usePathname();
  const { t } = useLocaleContext();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SIGNUP_VERIFIED_TOAST_KEY) !== "1") return;
    sessionStorage.removeItem(SIGNUP_VERIFIED_TOAST_KEY);
    setShouldRender(true);
    requestAnimationFrame(() => setIsVisible(true));

    const hideTimer = window.setTimeout(() => setIsVisible(false), 1900);
    const removeTimer = window.setTimeout(
      () => setShouldRender(false),
      1900 + MOTION_DURATION_MS.layerExit
    );
    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, [pathname]);

  if (!shouldRender) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[110] flex items-center justify-center px-4">
      <div
        className={`ui-floating-surface pointer-events-auto w-full max-w-sm rounded-2xl border border-orange-500/25 bg-[#111114]/95 px-6 py-5 text-center text-white shadow-[0_24px_64px_rgba(0,0,0,0.62)] backdrop-blur-2xl transition-[transform,opacity] [transition-timing-function:var(--ease-out)] motion-reduce:transition-opacity motion-reduce:duration-[var(--duration-reduced)] ${
          isVisible ? "duration-[var(--duration-layer-enter)] scale-100 opacity-100" : "duration-[var(--duration-layer-exit)] scale-95 opacity-0 motion-reduce:scale-100"
        }`}
      >
        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">DIGBOX</p>
        <h2 className="mt-2 text-lg font-black text-white">{t("toast.emailVerified")}</h2>
        <p className="mt-2 text-sm font-semibold text-gray-400">{t("toast.signupComplete")}</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const auth = useAuthContext();
  const productForm = useProductFormContext();
  const search = useSearchContext();
  const router = useRouter();
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");
  const isOnboardingPage = pathname?.startsWith("/onboarding");
  const isAuthPage = pathname === "/login" || pathname?.startsWith("/auth/");
  const usesMinimalChrome = isAuthPage || isOnboardingPage;
  const showFullChrome = !isAdminPage && !usesMinimalChrome;
  const hideMobileBottomNav = isAdminPage || usesMinimalChrome;

  useEffect(() => {
    if (!auth.isAuthLoading && auth.needsUsername && !isOnboardingPage) {
      if (!readAuthContinuation()) {
        saveAuthContinuation({ intent: "signup", returnTo: pathname || "/", source: "username_required", method: "google" });
      }
      router.replace("/onboarding/username");
    }
  }, [auth.isAuthLoading, auth.needsUsername, isOnboardingPage, pathname, router]);

  return (
    <>
      {showFullChrome && <AppHeader />}
      {usesMinimalChrome && <AppHeader variant="minimal" />}
      {children}
      {showFullChrome && search.result && <SearchResultOverlay />}
      {showFullChrome && <AddProductModal form={productForm} />}
      {showFullChrome && <ProductSubmitToast />}
      {showFullChrome && <SignupVerifiedToast />}
      {showFullChrome && <GoogleSignupWelcomeToast />}
      {showFullChrome && <ClosetToast />}
      {showFullChrome && <DigboxToast />}
      {showFullChrome && <GuestDigboxExperience />}
      {!hideMobileBottomNav && <MobileBottomNav />}
    </>
  );
}
