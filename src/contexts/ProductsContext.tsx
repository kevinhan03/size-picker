"use client";

import { createContext, useContext } from "react";
import { useProducts } from "../hooks/useProducts";
import type { Product } from "../types";

type ProductsContextValue = ReturnType<typeof useProducts>;

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({
  children,
  initialProducts = [],
}: {
  children: React.ReactNode;
  initialProducts?: Product[];
}) {
  const value = useProducts(initialProducts);
  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProductsContext() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error("useProductsContext must be used within ProductsProvider");
  }
  return context;
}
