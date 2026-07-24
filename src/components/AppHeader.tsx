"use client";

import { ArrowLeft, LogIn, Plus, Sparkles, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "../contexts/AuthContext";
import { useDigboxContext } from "../contexts/DigboxContext";
import { useProductFormContext } from "../contexts/ProductFormContext";
import { buildLoginHref } from "../utils/authNavigation";
import {
  getPrimaryNavigationDestination,
  primaryNavigationItems,
  type PrimaryNavigationDestination,
} from "./primaryNavigation";

export function AppHeader({ variant = "full" }: { variant?: "full" | "minimal" }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuthContext();
  const digbox = useDigboxContext();
  const productForm = useProductFormContext();
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [hiddenOnCompact, setHiddenOnCompact] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const media = window.matchMedia("(max-width: 1023px)");
    const updateViewport = () => {
      setIsCompactViewport(media.matches);
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
    return () => {
      window.removeEventListener("scroll", onScroll);
      media.removeEventListener("change", updateViewport);
    };
  }, []);

  const isAdmin = pathname.startsWith("/admin");
  const activeDestination = getPrimaryNavigationDestination(pathname);
  const isMyPage = pathname === "/mypage";
  const compactActions = isCompactViewport;
  const headerFrameClass = isCompactViewport
    ? "h-[calc(4rem+env(safe-area-inset-top))] w-full max-w-6xl px-4 pt-[env(safe-area-inset-top)]"
    : "h-16 w-full max-w-6xl px-4";

  function navigate(destination: PrimaryNavigationDestination) {
    if (destination === "digging") {
      router.push("/");
      return;
    }
    if (destination === "outfits") {
      router.push(auth.authUser ? "/outfits" : buildLoginHref("login", "/outfits"));
      return;
    }
    if (destination === "taste") {
      router.push("/taste-graph");
      return;
    }
    if (destination === "closet") {
      router.push("/closet");
      return;
    }
    if (!auth.authUser) {
      digbox.setIsGuestPanelOpen(true);
      return;
    }
    router.push(auth.dbUsername ? `/u/${encodeURIComponent(auth.dbUsername)}` : "/mypage");
  }

  function openProductForm() {
    if (!auth.authUser) {
      router.push("/login");
      return;
    }
    productForm.openModal();
  }

  const desktopNavClass = (active: boolean) =>
    `flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 transition ${
      active
        ? "bg-orange-500/15 text-orange-300"
        : "text-gray-400 hover:bg-white/[0.06] hover:text-white"
    }`;
  const tooltipClass = "pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#111114] px-2.5 py-1 text-xs font-semibold text-white opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-[opacity,transform] duration-150 ease-out scale-95 group-hover:delay-300 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:delay-0 group-focus-visible:scale-100 group-focus-visible:opacity-100";

  if (variant === "minimal") {
    return (
      <header className="app-header-motion pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center border-b border-white/[0.06] bg-black transition-transform duration-[180ms] [transition-timing-function:var(--ease-out)] motion-reduce:transition-none">
        <div className={`pointer-events-auto flex items-center justify-between ${headerFrameClass}`}>
          <Link href="/" aria-label="DIGBOX 홈으로" className="flex min-w-0 items-center gap-2 rounded-xl text-base font-bold tracking-tight text-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
            <Image src="/digbox-mark.png" alt="" width={40} height={40} className="h-8 w-8 object-contain lg:h-9 lg:w-9" />
            <span className="font-bold tracking-tight">DIGBOX</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-semibold text-gray-300 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.06] hover:text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 motion-reduce:transform-none motion-reduce:transition-none">
            <ArrowLeft className="h-3.5 w-3.5" />
            홈으로
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className={`app-header-motion pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center border-b border-white/[0.06] bg-black transition-transform duration-[180ms] [transition-timing-function:var(--ease-out)] ${hiddenOnCompact ? "-translate-y-full" : "translate-y-0"}`}>
      <div className={`pointer-events-auto flex items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr] ${headerFrameClass}`}>
        <div className="flex min-w-0 items-center">
          <div
            role="link"
            tabIndex={0}
            aria-label="DIGBOX 디깅으로 이동"
            onClick={() => router.push("/")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push("/");
              }
            }}
            className="flex min-w-0 cursor-pointer items-center gap-2 rounded-xl"
          >
            <span className="flex h-8 w-8 items-center justify-center lg:h-9 lg:w-9">
              <Image src="/digbox-mark.png" alt="" width={40} height={40} className="h-full w-full object-contain" />
            </span>
            <span className="flex min-w-0 flex-col text-left leading-none">
              <span className="font-bold tracking-tight text-orange-500">DIGBOX</span>
            </span>
          </div>
        </div>

        {!isAdmin && (
          <nav aria-label="주요 메뉴" className="hidden items-center gap-1 lg:flex">
            {primaryNavigationItems.map(({ destination, label, icon: Icon }) => (
              <button
                key={destination}
                type="button"
                aria-current={activeDestination === destination ? "page" : undefined}
                aria-label={label}
                onClick={() => navigate(destination)}
                className={desktopNavClass(activeDestination === destination)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-bold">{label}</span>
              </button>
            ))}
            <div className="group relative hidden">
              <button
                type="button"
                aria-current={pathname.startsWith("/dig-match") ? "page" : undefined}
                aria-label="디그매치"
                onClick={() => router.push(auth.authUser ? "/dig-match" : buildLoginHref("login", "/dig-match"))}
                className={desktopNavClass(pathname.startsWith("/dig-match"))}
              >
                <Sparkles className="h-5 w-5" />
              </button>
              <div className={tooltipClass}>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#111114]" />
                디그매치
              </div>
            </div>
          </nav>
        )}

        {!isAdmin && (
          <div className="flex items-center justify-end gap-2">
            <div className="group relative">
              <button type="button" onClick={openProductForm} aria-label="상품 추가" className={`flex h-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#00FF00]/30 bg-[#00FF00]/[0.08] text-[#00FF00] transition-[width,background-color,border-color] duration-300 ease-out hover:border-[#00FF00]/55 hover:bg-[#00FF00]/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF00]/80 ${compactActions ? "w-9" : "w-[4.25rem]"}`}>
                <Plus className="h-4 w-4" />
                <span className={`overflow-hidden whitespace-nowrap text-xs font-bold transition-[max-width,margin,opacity] duration-200 ease-out ${compactActions ? "ml-0 max-w-0 opacity-0" : "ml-1 max-w-10 opacity-100"}`}>상품</span>
              </button>
              <div className={tooltipClass}>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#111114]" />
                상품 추가
              </div>
            </div>
            {!pathname.startsWith("/dig-match") && <div className="group relative">
              <button
                type="button"
                aria-current={pathname.startsWith("/dig-match") ? "page" : undefined}
                aria-label="디그매치"
                onClick={() => router.push(auth.authUser ? "/dig-match" : buildLoginHref("login", "/dig-match"))}
                className={`flex h-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border text-xs font-bold transition-[width,background-color,border-color,color,box-shadow] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 ${compactActions ? "w-9" : "w-[6.5rem]"} ${
                  pathname.startsWith("/dig-match")
                    ? "border-orange-300 bg-orange-400 text-black shadow-[0_4px_16px_rgba(251,146,60,0.22)]"
                    : "border-orange-400/70 bg-orange-500/85 text-black shadow-[0_4px_16px_rgba(249,115,22,0.18)] hover:border-orange-300 hover:bg-orange-400"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span className={`overflow-hidden whitespace-nowrap transition-[max-width,margin,opacity] duration-200 ease-out ${compactActions ? "ml-0 max-w-0 opacity-0" : "ml-1.5 max-w-16 opacity-100"}`}>디그매치</span>
              </button>
              <div className={tooltipClass}>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#111114]" />
                디그매치
              </div>
            </div>}
            {auth.authUser ? (
              <div className="group relative">
                <button type="button" aria-label="마이페이지" onClick={() => router.push("/mypage")} className={`flex h-9 w-9 items-center justify-center rounded-xl border text-gray-300 transition hover:border-orange-500/50 hover:text-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 ${isMyPage ? "border-orange-500/40 bg-orange-500/15 text-orange-300" : "border-white/15 bg-white/[0.06]"}`}>
                  <UserRound className="h-4 w-4" />
                </button>
                <div className={tooltipClass}>
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#111114]" />
                  마이페이지
                </div>
              </div>
            ) : (
              <div className="group relative">
                <button type="button" aria-label="로그인" onClick={() => router.push("/login")} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-gray-300 transition hover:border-orange-500/50 hover:text-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80">
                  <LogIn className="h-4 w-4" />
                </button>
                <div className={tooltipClass}>
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#111114]" />
                  로그인
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
