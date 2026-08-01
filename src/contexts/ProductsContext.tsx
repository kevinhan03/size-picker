"use client";

import { createContext, useContext } from "react";
import { useProducts } from "../hooks/useProducts";
import type { Product } from "../types";

type ProductsContextValue = ReturnType<typeof useProducts>;

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({
  children,
  initialProducts = [],
  initialNextOffset,
  initialError = null,
  enabled = true,
  catalog = false,
}: {
  children: React.ReactNode;
  initialProducts?: Product[];
  initialNextOffset?: number | null;
  initialError?: string | null;
  enabled?: boolean;
  catalog?: boolean;
}) {
  const value = useProducts(initialProducts, {
    enabled,
    catalog,
    initialNextOffset,
    initialError,
  });
  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProductsContext() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error("useProductsContext must be used within ProductsProvider");
  }
  return context;
}
