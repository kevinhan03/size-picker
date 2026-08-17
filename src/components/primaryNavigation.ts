import { Compass, Network, Shirt, Star } from "lucide-react";
import type { ComponentType } from "react";
import { ClosetIcon } from "./icons/ClosetIcon";
import type { MessageKey } from "../i18n/messages";

export type PrimaryNavigationDestination = "digging" | "outfits" | "taste" | "closet" | "digbox";

export type PrimaryNavigationItem = {
  destination: PrimaryNavigationDestination;
  labelKey: MessageKey;
  icon: ComponentType<{ className?: string }>;
};

export const primaryNavigationItems: PrimaryNavigationItem[] = [
  { destination: "digging", labelKey: "nav.digging", icon: Compass },
  { destination: "outfits", labelKey: "nav.outfits", icon: Shirt },
  { destination: "taste", labelKey: "nav.taste", icon: Network },
  { destination: "digbox", labelKey: "nav.saved", icon: Star },
  { destination: "closet", labelKey: "nav.closet", icon: ClosetIcon },
];

export function getPrimaryNavigationDestination(pathname: string): PrimaryNavigationDestination | null {
  if (pathname === "/" || pathname === "/grid" || pathname.startsWith("/product/")) return "digging";
  if (pathname.startsWith("/outfits")) return "outfits";
  if (pathname.startsWith("/taste")) return "taste";
  if (pathname.startsWith("/closet")) return "closet";
  if (pathname === "/saved" || pathname.startsWith("/u/")) return "digbox";
  return null;
}
