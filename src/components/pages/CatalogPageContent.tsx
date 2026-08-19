import { Suspense } from "react";
import { getCatalogPage } from "../../../server/services/catalog";
import type { ProductCardData } from "../../types";
import { ProductsProvider } from "../../contexts/ProductsContext";
import { SearchPageClient } from "./SearchPageClient";
import { getRequestLocale } from "../../../server/utils/locale";
import { translate } from "../../i18n/messages";

export async function CatalogPageContent() {
  let initialProducts: ProductCardData[] = [];
  let initialNextOffset: number | null = null;
  let initialError: string | null = null;

  try {
    const page = await getCatalogPage(0, 24);
    initialProducts = page.products;
    initialNextOffset = page.nextOffset;
  } catch {
    initialError = translate(await getRequestLocale(), "products.loadError");
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
