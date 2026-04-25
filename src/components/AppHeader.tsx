"use client";

import { useEffect, useState } from "react";
import { LogIn, Plus, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "../contexts/AuthContext";
import { useProductFormContext } from "../contexts/ProductFormContext";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const authContext = useAuthContext();
  const productForm = useProductFormContext();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const authUser = authContext.authUser;
  const dbUsername = authContext.dbUsername;

  const isLogin = pathname === "/login";
  const isAdmin = pathname === "/admin";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div
        className={`pointer-events-auto transition-all duration-300 ease-out flex items-center justify-between ${
          scrolled
            ? "mt-3 px-4 h-12 w-[calc(100%-2rem)] max-w-2xl rounded-2xl bg-[#111114] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            : "mt-0 px-4 h-16 w-full max-w-6xl rounded-none bg-transparent border-b border-transparent"
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div className={`flex items-center justify-center transition-all duration-300 ${scrolled ? "w-7 h-7" : "w-10 h-10"}`}>
              <img src="/favicon-simple.svg" alt="DIGBOX logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <span className={`font-bold tracking-tight text-orange-500 transition-all duration-300 ${scrolled ? "text-base" : "text-xl"}`}>DIGBOX</span>
              {!scrolled && <span className="text-[10px] text-white/60 tracking-tight">취향은 더 깊게, 발견은 더 쉽게</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isAdmin && (
            <div className="group relative">
              <button
                onClick={() => productForm.openModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition backdrop-blur-xl border border-[#00FF00]/40 bg-[linear-gradient(180deg,rgba(0,255,0,0.22),rgba(0,255,0,0.09))] text-[#00FF00] hover:border-[#00FF00]/70 hover:bg-[linear-gradient(180deg,rgba(0,255,0,0.32),rgba(0,255,0,0.15))] shadow-[0_4px_16px_rgba(0,255,0,0.15)]"
              >
                <Plus className="w-4 h-4" />
              </button>
              <div className="pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#111114] px-2.5 py-1 text-xs font-semibold text-white opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all duration-150 ease-out scale-95 group-hover:opacity-100 group-hover:scale-100">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#111114]" />
                상품 추가
              </div>
            </div>
          )}
          {authUser && !isAdmin && (
            <div className="group relative">
              <button
                onClick={() => router.push("/mypage")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition backdrop-blur-xl border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.07))] text-gray-200 hover:border-orange-500/60 hover:text-orange-400 shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
              >
                <UserRound className="w-4 h-4" />
              </button>
              <div className="pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#111114] px-2.5 py-1 text-xs font-semibold text-white opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all duration-150 ease-out scale-95 group-hover:opacity-100 group-hover:scale-100">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#111114]" />
                마이페이지
              </div>
            </div>
          )}
          {!authUser && !isAdmin && (
            <button
              onClick={() => router.push("/login")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition backdrop-blur-xl border shadow-[0_4px_16px_rgba(0,0,0,0.2)] ${
                isLogin
                  ? "bg-orange-500 text-black border-orange-500"
                  : "border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.07))] text-gray-200 hover:border-orange-500/60 hover:text-orange-400"
              }`}
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
