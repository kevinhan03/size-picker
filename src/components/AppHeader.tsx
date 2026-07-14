"use client";

import { Compass, LogIn, Plus, Search, Shirt, Sparkles, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "../contexts/AuthContext";
import { useProductFormContext } from "../contexts/ProductFormContext";
import { buildLoginHref } from "../utils/authNavigation";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuthContext();
  const productForm = useProductFormContext();
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hiddenOnMobile, setHiddenOnMobile] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const media = window.matchMedia("(max-width: 639px)");
    const updateIsMobile = () => {
      const nextIsMobile = media.matches;
      setIsMobile(nextIsMobile);
      if (!nextIsMobile) setHiddenOnMobile(false);
    };
    const onScroll = () => {
      const nextY = window.scrollY;
      setScrolled(nextY > 8);
      if (!media.matches) {
        setHiddenOnMobile(false);
      } else if (nextY <= 8) {
        setHiddenOnMobile(false);
      } else if (nextY > lastY) {
        setHiddenOnMobile(true);
      } else if (nextY < lastY) {
        setHiddenOnMobile(false);
      }
      lastY = nextY;
    };
    updateIsMobile();
    window.addEventListener("scroll", onScroll, { passive: true });
    media.addEventListener("change", updateIsMobile);
    return () => {
      window.removeEventListener("scroll", onScroll);
      media.removeEventListener("change", updateIsMobile);
    };
  }, []);

  const isAdmin = pathname.startsWith("/admin");
  const compactHeader = scrolled && !isMobile;
  const isDigging = pathname === "/" || pathname === "/grid" || pathname.startsWith("/product/");
  const isDigMatch = pathname.startsWith("/dig-match");
  const isOutfits = pathname.startsWith("/outfits");
  const isMy = pathname === "/mypage" || pathname.startsWith("/closet") || pathname.startsWith("/u/");
  const headerFrameClass = isMobile
    ? "mt-0 h-[calc(4rem+env(safe-area-inset-top))] w-full max-w-none rounded-none border-0 bg-black px-4 pt-[env(safe-area-inset-top)] shadow-none"
    : compactHeader
      ? "mt-3 h-12 w-[calc(100%-2rem)] max-w-3xl rounded-2xl border border-white/10 bg-[#111114] px-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
      : "mt-0 h-16 w-full max-w-6xl rounded-none border-b border-transparent bg-transparent px-4";

  function goToOutfits() {
    router.push(auth.authUser ? "/outfits" : buildLoginHref("login", "/outfits"));
  }

  function openProductForm() {
    if (!auth.authUser) {
      router.push("/login");
      return;
    }
    productForm.openModal();
  }

  function focusProductSearch() {
    if (pathname !== "/") {
      router.push("/?focusSearch=1");
      return;
    }
    const input = document.getElementById("main-product-search") as HTMLInputElement | null;
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => input?.focus(), 250);
  }

  const desktopNavClass = (active: boolean) =>
    `flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-black shadow-none transition ${
      active ? "bg-orange-500/15 text-orange-300" : "text-gray-400 hover:bg-white/[0.06] hover:text-white"
    }`;

  return (
    <header className={`pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center transition-transform duration-300 ease-out ${hiddenOnMobile ? "-translate-y-full" : "translate-y-0"}`}>
      <div className={`pointer-events-auto flex items-center justify-between transition-all duration-300 ease-out ${headerFrameClass}`}>
        <div className="flex min-w-0 items-center gap-4">
          <button type="button" onClick={() => router.push("/")} aria-label="DIGBOX 홈" className="flex min-w-0 items-center gap-2 rounded-xl shadow-none">
            <span className={`flex items-center justify-center transition-all duration-300 ${compactHeader ? "h-7 w-7" : "h-10 w-10"}`}>
              <Image src="/favicon-simple.svg" alt="" width={40} height={40} className="h-full w-full object-contain" />
            </span>
            <span className="flex min-w-0 flex-col text-left leading-none">
              <span className={`font-bold tracking-tight text-orange-500 transition-all duration-300 ${compactHeader ? "text-base" : "text-xl"}`}>DIGBOX</span>
              {!compactHeader && <span className="hidden text-[10px] tracking-tight text-white/60 lg:block">취향은 더 깊게, 발견은 더 쉽게</span>}
            </span>
          </button>

          {!isAdmin && (
            <div className="hidden items-center gap-1 sm:flex">
              <button type="button" aria-current={isDigging ? "page" : undefined} onClick={() => router.push("/")} className={desktopNavClass(isDigging)}>
                <Compass className="h-4 w-4" /> 디깅
              </button>
              <button type="button" aria-current={isOutfits ? "page" : undefined} onClick={goToOutfits} className={desktopNavClass(isOutfits)}>
                <Shirt className="h-4 w-4" /> 코디
              </button>
              <button type="button" aria-current={isDigMatch ? "page" : undefined} onClick={() => router.push("/dig-match")} className={desktopNavClass(isDigMatch)}>
                <Sparkles className="h-4 w-4" /> 디그매치
              </button>
            </div>
          )}
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={focusProductSearch}
              aria-label="상품 검색"
              title="상품 검색"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-gray-300 shadow-none transition hover:border-orange-500/50 hover:text-orange-400 sm:hidden"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={openProductForm}
              aria-label="상품 추가"
              className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#00FF00]/40 bg-[linear-gradient(180deg,rgba(0,255,0,0.22),rgba(0,255,0,0.09))] px-2.5 text-xs font-black text-[#00FF00] shadow-[0_4px_16px_rgba(0,255,0,0.15)] transition hover:border-[#00FF00]/70 hover:bg-[linear-gradient(180deg,rgba(0,255,0,0.32),rgba(0,255,0,0.15))] sm:px-3"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">상품 추가</span>
            </button>
            {auth.authUser ? (
              <button
                type="button"
                aria-current={isMy ? "page" : undefined}
                onClick={() => router.push("/mypage")}
                className={`hidden h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-black shadow-none transition sm:flex ${
                  isMy ? "border-orange-500/40 bg-orange-500/15 text-orange-300" : "border-white/15 bg-white/[0.06] text-gray-300 hover:border-orange-500/50 hover:text-orange-400"
                }`}
              >
                <UserRound className="h-4 w-4" /> 마이
              </button>
            ) : (
              <button
                type="button"
                aria-current={pathname === "/login" ? "page" : undefined}
                onClick={() => router.push("/login")}
                className={`hidden h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-black shadow-none transition sm:flex ${
                  pathname === "/login" ? "border-orange-500 bg-orange-500 text-black" : "border-white/15 bg-white/[0.06] text-gray-300 hover:border-orange-500/50 hover:text-orange-400"
                }`}
              >
                <LogIn className="h-4 w-4" /> 로그인
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
