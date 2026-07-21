import { Compass, Network, Shirt, Star } from "lucide-react";
import type { ComponentType } from "react";
import { ClosetIcon } from "./icons/ClosetIcon";

export type PrimaryNavigationDestination = "digging" | "outfits" | "taste" | "closet" | "digbox";

export type PrimaryNavigationItem = {
  destination: PrimaryNavigationDestination;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export const primaryNavigationItems: PrimaryNavigationItem[] = [
  { destination: "digging", label: "디깅", icon: Compass },
  { destination: "outfits", label: "코디", icon: Shirt },
  { destination: "taste", label: "취향", icon: Network },
  { destination: "digbox", label: "저장", icon: Star },
  { destination: "closet", label: "옷장", icon: ClosetIcon },
];

export function getPrimaryNavigationDestination(pathname: string): PrimaryNavigationDestination | null {
  if (pathname === "/" || pathname === "/grid" || pathname.startsWith("/product/")) return "digging";
  if (pathname.startsWith("/outfits")) return "outfits";
  if (pathname.startsWith("/taste-graph")) return "taste";
  if (pathname.startsWith("/closet")) return "closet";
  if (pathname.startsWith("/u/")) return "digbox";
  return null;
}
