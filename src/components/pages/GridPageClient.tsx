"use client";

import type { SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { GridView } from "../GridView";
import { useProductsContext } from "../../contexts/ProductsContext";
import { useGridState } from "../../hooks/useGridState";
import { getProductPageUrl } from "../../utils/product";

export function GridPageClient() {
  const { products } = useProductsContext();
  const router = useRouter();
  const grid = useGridState(products);

  const handleImageLoadError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.style.display = "none";
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--app-main-pt)] text-white">
      <GridView
        allProducts={products}
        filteredGridProducts={grid.filteredGridProducts}
        gridCategoryCounts={grid.gridCategoryCounts}
        gridCategoryFilter={grid.gridCategoryFilter}
        setGridCategoryFilter={grid.setGridCategoryFilter}
        gridSearchQuery={grid.gridSearchQuery}
        setGridSearchQuery={grid.setGridSearchQuery}
        onProductClick={(product) => {
          router.push(getProductPageUrl(product), { scroll: false });
        }}
        onImageError={handleImageLoadError}
      />
    </main>
  );
}
