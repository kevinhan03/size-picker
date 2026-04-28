"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AddProductModal } from "./AddProductModal";
import { AppHeader } from "./AppHeader";
import { GoogleSignupCompleteModal } from "./GoogleSignupCompleteModal";
import { NeedsUsernameModal } from "./NeedsUsernameModal";
import { SearchResultOverlay } from "./SearchResultOverlay";
import { useAuthContext } from "../contexts/AuthContext";
import { useClosetContext } from "../contexts/ClosetContext";
import { useDigboxContext } from "../contexts/DigboxContext";
import { useProductFormContext } from "../contexts/ProductFormContext";

function ClosetIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 4.75h12c.69 0 1.25.56 1.25 1.25v13.25H4.75V6c0-.69.56-1.25 1.25-1.25Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 4.75v14.5M8.75 12h.01M15.25 12h.01M7 19.25v1M17 19.25v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClosetToast() {
  const { toast, clearToast } = useClosetContext();
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
    }, 220);

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, [toast]);

  if (!visibleToast) return null;

  const isLoginRequired = visibleToast.message === "login_required";
  const isAdded = visibleToast.message === "added";

  return (
    <div className="pointer-events-none fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 z-[90] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2">
      <div
        className={`pointer-events-auto flex items-center gap-3 rounded-2xl border border-orange-500/25 bg-[#111114]/95 px-4 py-3 text-sm text-white shadow-[0_18px_48px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-all duration-200 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
          <ClosetIcon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">
            {isLoginRequired ? "로그인이 필요해요" : isAdded ? "옷장에 추가했어요" : "이미 옷장에 있어요"}
          </p>
          <p className="truncate text-xs text-gray-400">
            {isLoginRequired ? "옷장 기능은 로그인 후 사용할 수 있어요" : isAdded ? "상품을 My Closet에서 볼 수 있어요" : "My Closet에 저장된 상품이에요"}
          </p>
        </div>

        {isLoginRequired ? (
          <Link
            href="/login"
            onClick={clearToast}
            className="flex-shrink-0 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-orange-400"
          >
            로그인
          </Link>
        ) : isAdded ? (
          <Link
            href="/closet"
            onClick={clearToast}
            className="flex-shrink-0 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-orange-400"
          >
            보기
          </Link>
        ) : (
          <button
            type="button"
            onClick={clearToast}
            aria-label="알림 닫기"
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
  const { toast, clearToast } = useDigboxContext();
  const auth = useAuthContext();
  const router = useRouter();
  const usernameRef = useRef(auth.dbUsername);
  usernameRef.current = auth.dbUsername;
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
    }, 220);

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
  const isAdded = visibleToast.message === "added";

  return (
    <div className="pointer-events-none fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 z-[90] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2">
      <div
        className={`pointer-events-auto flex items-center gap-3 rounded-2xl border border-yellow-400/25 bg-[#111114]/95 px-4 py-3 text-sm text-white shadow-[0_18px_48px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-all duration-200 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-400">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill={isAdded ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">
            {isLoginRequired ? "로그인이 필요해요" : isAdded ? "DIGBOX에 담았어요" : "이미 DIGBOX에 있어요"}
          </p>
          <p className="truncate text-xs text-gray-400">
            {isLoginRequired
              ? "DIGBOX 기능은 로그인 후 사용할 수 있어요"
              : isAdded
              ? "내 DIGBOX에서 확인할 수 있어요"
              : "이미 디깅한 상품이에요"}
          </p>
        </div>

        {isLoginRequired ? (
          <Link
            href="/login"
            onClick={clearToast}
            className="flex-shrink-0 rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-yellow-300"
          >
            로그인
          </Link>
        ) : isAdded ? (
          <button
            type="button"
            onClick={handleViewDigbox}
            className="flex-shrink-0 rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-yellow-300"
          >
            보기
          </button>
        ) : (
          <button
            type="button"
            onClick={clearToast}
            aria-label="알림 닫기"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const auth = useAuthContext();
  const productForm = useProductFormContext();
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");

  return (
    <>
      {!isAdminPage && <AppHeader />}
      {children}
      <SearchResultOverlay />
      <AddProductModal form={productForm} />
      {!isAdminPage && <ClosetToast />}
      {!isAdminPage && <DigboxToast />}
      {auth.needsUsername && (
        <NeedsUsernameModal
          pendingUsername={auth.pendingUsername}
          onUsernameChange={auth.setPendingUsername}
          onSubmit={() => void auth.submitUsername(() => {})}
          usernameError={auth.usernameError}
          isSubmitting={auth.isSubmittingUsername}
        />
      )}
      {auth.googleSignupComplete && (
        <GoogleSignupCompleteModal
          onStart={() => {
            auth.setGoogleSignupComplete(false);
          }}
        />
      )}
    </>
  );
}
