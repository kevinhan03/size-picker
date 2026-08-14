import { Suspense } from "react";
import { getCatalogPage } from "../../../server/services/catalog";
import type { ProductCardData } from "../../types";
import { ProductsProvider } from "../../contexts/ProductsContext";
import { SearchPageClient } from "./SearchPageClient";

export async function CatalogPageContent() {
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
  );
}
