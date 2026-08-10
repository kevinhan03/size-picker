import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPageClient } from "../src/components/pages/SearchPageClient";
import { ProductsProvider } from "../src/contexts/ProductsContext";
import { getCatalogPage } from "../server/services/catalog";
import type { ProductCardData } from "../src/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.digbox.co.kr";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "DIGBOX | 디그박스",
  description: "좋아하는 옷을 기록하고 공유하며, 서로의 취향에서 새로운 스타일을 발견하는 곳, DIGBOX.",
};

export default async function Page() {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DIGBOX | 디그박스",
    alternateName: ["DIGBOX", "디그박스"],
    url: siteUrl,
  };

  let initialProducts: ProductCardData[] = [];
  let initialNextOffset: number | null = null;
  let initialError: string | null = null;
  try {
    const page = await getCatalogPage(0, 24);
    initialProducts = page.products;
    initialNextOffset = page.nextOffset;
  } catch {
    initialError = "상품 정보를 불러오지 못했습니다.";
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <ProductsProvider
        initialProducts={initialProducts}
        initialNextOffset={initialNextOffset}
        initialError={initialError}
        catalog
      >
        <Suspense fallback={<main className="min-h-screen bg-black" />}>
          <SearchPageClient />
        </Suspense>
      </ProductsProvider>
    </>
  );
}
