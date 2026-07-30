"use client";

import { createContext, useContext } from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  // Dig Match owns a small, server-selected feed. Keep the context mounted for
  // shared providers, but never trigger its full catalogue query on this route.
  const value = useProducts(initialProducts, { enabled: !pathname?.startsWith("/dig-match") });
  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProductsContext() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error("useProductsContext must be used within ProductsProvider");
  }
  return context;
}
