"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "../contexts/AuthContext";
import { useDigboxContext } from "../contexts/DigboxContext";
import { useNavigationProgress } from "../contexts/NavigationProgressContext";
import { captureEvent } from "../utils/analytics";
import { useLocaleContext } from "../contexts/LocaleContext";
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
  const { startNavigation } = useNavigationProgress();
  const { t } = useLocaleContext();
  const activeDestination = getPrimaryNavigationDestination(pathname);

  function navigate(destination: PrimaryNavigationDestination) {
    captureEvent("mobile_nav_clicked", { destination, is_authenticated: Boolean(auth.authUser) });
    if (activeDestination === destination) return;
    startNavigation();
    if (destination === "digging") return void router.push("/");
    if (destination === "outfits") return void router.push("/outfits");
    if (destination === "taste") return void router.push("/taste");
    if (destination === "closet") return void router.push("/closet");
    if (!auth.authUser) return void router.push("/saved");
    router.push(auth.dbUsername ? `/u/${encodeURIComponent(auth.dbUsername)}` : "/mypage");
  }

  return (
    <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-[60] h-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))] border-t border-white/10 bg-[#0b0b0d]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl lg:hidden">
      <div className="mx-auto grid h-[var(--app-bottom-nav-height)] max-w-md grid-cols-5 px-2">
        {primaryNavigationItems.map(({ destination, labelKey, icon: Icon }) => {
          const active = activeDestination === destination;
          return (
            <button key={destination} type="button" aria-current={active ? "page" : undefined} aria-label={t(labelKey)} onClick={() => navigate(destination)} className={`relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-black leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 ${active ? "text-orange-400" : "text-gray-400 hover:bg-white/[0.04] hover:text-gray-100"}`}>
              {active && <span className="absolute top-1.5 h-0.5 w-6 rounded-full bg-orange-400" aria-hidden="true" />}
              <span className="relative">
                <Icon className={`h-6 w-6 ${destination === "digbox" && active ? "fill-current" : ""}`} />
                {destination === "digbox" && !auth.authUser && digbox.guestCount > 0 && (
                  <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[9px] font-black text-black">{digbox.guestCount}</span>
                )}
              </span>
              <span>{t(labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
