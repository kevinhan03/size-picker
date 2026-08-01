import type { Metadata } from "next";
import { TasteSwipePageClient } from "../../../src/components/pages/TasteSwipePageClient";
import { getDigMatchProducts } from "../../../server/services/dig-match-products.js";

export const metadata: Metadata = {
  title: "빠른 취향 탐색 | DIGBOX",
  description: "카드를 넘기며 나의 취향을 더 선명하게 만드세요.",
  robots: { index: false, follow: false },
};

export default async function TasteSwipePage() {
  const products = await getDigMatchProducts({ limit: 36, seed: "swipe" }).catch(() => []);
  return <TasteSwipePageClient initialProducts={products} />;
}
