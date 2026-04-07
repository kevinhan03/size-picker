"use client";

import { Globe, LayoutGrid, LogIn, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "../contexts/AuthContext";
import { useProductFormContext } from "../contexts/ProductFormContext";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const authContext = useAuthContext();
  const productForm = useProductFormContext();

  const authUser = authContext.authUser;
  const dbUsername = authContext.dbUsername;

  const isConverter = pathname === "/converter";
  const isLogin = pathname === "/login";
  const isAdmin = pathname === "/admin";

  return (
    <header className="fixed top-0 w-full bg-black/90 backdrop-blur-md border-b border-gray-800 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/favicon-simple.svg" alt="DIGBOX logo" className="w-7 h-7 object-contain" />
            </div>
            <span className="font-bold text-xl tracking-tight text-orange-500">DIGBOX</span>
          </div>
          {authUser && (
            <span
              className="text-gray-500 text-xs font-medium cursor-pointer hover:text-gray-300 transition"
              onClick={() => router.push("/mypage")}
            >
              | {String(dbUsername ?? authUser.email?.split("@")[0] ?? "")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/converter")}
            className={`p-1.5 rounded-lg transition border backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.2)] ${
              isConverter
                ? "bg-orange-500 text-black border-orange-500"
                : "bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.07))] border-white/20 text-gray-200 hover:border-orange-500/60 hover:text-orange-400"
            }`}
            title="Size converter"
          >
            <Globe className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push("/grid")}
            className="p-1.5 text-gray-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.07))] backdrop-blur-xl border border-white/20 hover:text-orange-400 hover:border-orange-500/60 transition rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
            title="Product grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          {!isAdmin && (
            <button
              onClick={() => productForm.openModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition backdrop-blur-xl border border-[#00FF00]/40 bg-[linear-gradient(180deg,rgba(0,255,0,0.22),rgba(0,255,0,0.09))] text-[#00FF00] hover:border-[#00FF00]/70 hover:bg-[linear-gradient(180deg,rgba(0,255,0,0.32),rgba(0,255,0,0.15))] shadow-[0_4px_16px_rgba(0,255,0,0.15)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add product</span>
            </button>
          )}
          {!authUser && !isAdmin && (
            <button
              onClick={() => router.push("/login")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition backdrop-blur-xl border shadow-[0_4px_16px_rgba(0,0,0,0.2)] ${
                isLogin
                  ? "bg-orange-500 text-black border-orange-500"
                  : "border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.07))] text-gray-200 hover:border-orange-500/60 hover:text-orange-400"
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
