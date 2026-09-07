import { Bookmark, Compass, Search, Shirt, UserRound } from "lucide-react";
import type { ComponentType } from "react";
import type { MessageKey } from "../i18n/messages";
import { RESERVED_PROFILE_USERNAMES, USERNAME_PATTERN } from "../utils/username";

export type PrimaryNavigationDestination =
  "digging" | "outfits" | "taste" | "closet" | "digbox" | "outfit-explorer" | "profile";

export type PrimaryNavigationItem = {
  destination: PrimaryNavigationDestination;
  labelKey: MessageKey;
  icon: ComponentType<{ className?: string }>;
};

export const primaryNavigationItems: PrimaryNavigationItem[] = [
  { destination: "digging", labelKey: "nav.digging", icon: Compass },
  { destination: "outfits", labelKey: "nav.outfits", icon: Shirt },
  { destination: "outfit-explorer", labelKey: "nav.explore", icon: Search },
  { destination: "digbox", labelKey: "nav.saved", icon: Bookmark },
  { destination: "profile", labelKey: "nav.profile", icon: UserRound },
];

export const mobilePrimaryNavigationItems = primaryNavigationItems;

export function isPublicProfilePath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return (
    segments.length === 1 &&
    USERNAME_PATTERN.test(segments[0]) &&
    !RESERVED_PROFILE_USERNAMES.has(segments[0].toLowerCase())
  );
}

export function getPrimaryNavigationDestination(
  pathname: string
): PrimaryNavigationDestination | null {
  if (
    pathname === "/" ||
    pathname === "/grid" ||
    pathname.startsWith("/product/")
  )
    return "digging";
  if (pathname.startsWith("/outfits")) return "outfits";
  if (pathname.startsWith("/taste")) return "taste";
  if (pathname.startsWith("/closet")) return "profile";
  if (pathname.startsWith("/outfit-explorer")) return "outfit-explorer";
  if (pathname === "/saved") return "digbox";
  if (
    pathname === "/mypage" ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/sizes") ||
    isPublicProfilePath(pathname)
  )
    return "profile";
  return null;
}
