"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "../contexts/AuthContext";
import { useDigboxContext } from "../contexts/DigboxContext";
import { captureEvent } from "../utils/analytics";
import { buildLoginHref } from "../utils/authNavigation";
import {
  getPrimaryNavigationDestination,
  primaryNavigationItems,
  type PrimaryNavigationDestination,
} from "./primaryNavigation";

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuthContext();
  const digbox = useDigboxContext();
  const activeDestination = getPrimaryNavigationDestination(pathname);

  function navigate(destination: PrimaryNavigationDestination) {
    captureEvent("mobile_nav_clicked", { destination, is_authenticated: Boolean(auth.authUser) });
    if (destination === "digging") return void router.push("/");
    if (destination === "outfits") return void router.push(auth.authUser ? "/outfits" : buildLoginHref("login", "/outfits"));
    if (destination === "taste") return void router.push("/taste-graph");
    if (destination === "closet") return void router.push("/closet");
    if (!auth.authUser) return void digbox.setIsGuestPanelOpen(true);
    router.push(auth.dbUsername ? `/u/${encodeURIComponent(auth.dbUsername)}` : "/mypage");
  }

  return (
    <nav aria-label="주요 메뉴" className="fixed inset-x-0 bottom-0 z-[60] h-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))] border-t border-white/10 bg-[#0b0b0d]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl lg:hidden">
      <div className="mx-auto grid h-[var(--app-bottom-nav-height)] max-w-md grid-cols-5 px-2">
        {primaryNavigationItems.map(({ destination, label, icon: Icon }) => {
          const active = activeDestination === destination;
          return (
            <button key={destination} type="button" aria-current={active ? "page" : undefined} aria-label={label} onClick={() => navigate(destination)} className={`relative flex min-h-11 flex-col items-center justify-center rounded-xl px-2 text-[10px] font-black shadow-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 ${active ? "gap-0.5 text-orange-400" : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-200"}`}>
              <span className="relative">
                <Icon className={`h-5 w-5 ${destination === "digbox" && active ? "fill-current" : ""}`} />
                {destination === "digbox" && !auth.authUser && digbox.guestCount > 0 && (
                  <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[9px] font-black text-black">{digbox.guestCount}</span>
                )}
              </span>
              {active && <span className="leading-none">{label}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
