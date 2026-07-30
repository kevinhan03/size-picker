import type { Metadata } from "next";
import { TasteSwipePageClient } from "../../../src/components/pages/TasteSwipePageClient";

export const metadata: Metadata = {
  title: "빠른 취향 탐색 | DIGBOX",
  description: "카드를 넘기며 나의 취향을 더 선명하게 만드세요.",
  robots: { index: false, follow: false },
};

export default function TasteSwipePage() {
  return <TasteSwipePageClient />;
}
