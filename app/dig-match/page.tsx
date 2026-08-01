import type { Metadata } from "next";
import { DigMatchPageClient } from "../../src/components/pages/DigMatchPageClient";
import { getDigMatchProducts } from "../../server/services/dig-match-products.js";

export const metadata: Metadata = {
  title: "DIG MATCH | DIGBOX",
  description: "상품을 비교하며 나만의 취향을 발견하세요.",
  robots: { index: false, follow: false },
};

export default async function DigMatchPage() {
  const products = await getDigMatchProducts({ limit: 36, seed: "initial" }).catch(() => []);
  return <DigMatchPageClient initialProducts={products} />;
}
