"use client";

import { Compass, Shirt, Star, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "../contexts/AuthContext";
import { useDigboxContext } from "../contexts/DigboxContext";
import { captureEvent } from "../utils/analytics";
import { buildLoginHref } from "../utils/authNavigation";

type MobileDestination = "digging" | "outfits" | "digbox" | "my";

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuthContext();
  const digbox = useDigboxContext();

  const activeDestination: MobileDestination | null =
    pathname === "/" || pathname === "/grid" || pathname.startsWith("/product/")
      ? "digging"
      : pathname.startsWith("/outfits")
        ? "outfits"
        : pathname.startsWith("/u/")
          ? "digbox"
          : pathname === "/mypage" || pathname.startsWith("/closet")
            ? "my"
            : null;

  function record(destination: MobileDestination) {
    captureEvent("mobile_nav_clicked", {
      destination,
      is_authenticated: Boolean(auth.authUser),
    });
  }

  function navigate(destination: MobileDestination) {
    record(destination);

    if (destination === "digging") {
      router.push("/");
      return;
    }
    if (destination === "outfits") {
      router.push(auth.authUser ? "/outfits" : buildLoginHref("login", "/outfits"));
      return;
    }
    if (destination === "digbox") {
      if (!auth.authUser) {
        digbox.setIsGuestPanelOpen(true);
        return;
      }
      router.push(auth.dbUsername ? `/u/${encodeURIComponent(auth.dbUsername)}` : "/mypage");
      return;
    }
    router.push(auth.authUser ? "/mypage" : buildLoginHref("login", "/mypage"));
  }

  const items = [
    { destination: "digging" as const, label: "디깅", icon: Compass },
    { destination: "outfits" as const, label: "코디", icon: Shirt },
    { destination: "digbox" as const, label: "DIGBOX", icon: Star },
    { destination: "my" as const, label: "마이", icon: UserRound },
  ];

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-[60] h-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))] border-t border-white/10 bg-[#0b0b0d]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl sm:hidden"
    >
      <div className="mx-auto grid h-[var(--app-bottom-nav-height)] max-w-md grid-cols-4 px-2">
        {items.map(({ destination, label, icon: Icon }) => {
          const active = activeDestination === destination;
          return (
            <button
              key={destination}
              type="button"
              aria-current={active ? "page" : undefined}
              aria-label={label}
              onClick={() => navigate(destination)}
              className={`relative flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-black shadow-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 ${
                active ? "text-orange-400" : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-200"
              }`}
            >
              <span className="relative">
                <Icon className={`h-5 w-5 ${destination === "digbox" && active ? "fill-current" : ""}`} />
                {destination === "digbox" && !auth.authUser && digbox.guestCount > 0 && (
                  <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[9px] font-black text-black">
                    {digbox.guestCount}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
