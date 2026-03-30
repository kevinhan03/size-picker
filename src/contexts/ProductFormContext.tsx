"use client";

import { createContext, useContext, useMemo } from "react";
import { useProductForm } from "../hooks/useProductForm";
import { normalizeComparableProductUrl } from "../utils/product";
import { useProductsContext } from "./ProductsContext";

type ProductFormContextValue = ReturnType<typeof useProductForm>;

const ProductFormContext = createContext<ProductFormContextValue | null>(null);

export function ProductFormProvider({ children }: { children: React.ReactNode }) {
  const products = useProductsContext();
  const productUrlSet = useMemo(
    () =>
      new Set(
        products.products
          .map((product) => normalizeComparableProductUrl(product.url))
          .filter(Boolean)
      ),
    [products.products]
  );

  const value = useProductForm({
    productUrlSet,
    onSubmitSuccess: () => {
      products.retryProductsLoad();
      products.setProductsError(null);
    },
  });

  return <ProductFormContext.Provider value={value}>{children}</ProductFormContext.Provider>;
}

export function useProductFormContext() {
  const context = useContext(ProductFormContext);
  if (!context) {
    throw new Error("useProductFormContext must be used within ProductFormProvider");
  }
  return context;
}
