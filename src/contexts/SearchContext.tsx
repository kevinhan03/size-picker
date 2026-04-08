"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { useProductSearch } from "../hooks/useProductSearch";
import { useProductsContext } from "./ProductsContext";
import { getProductPageUrl } from "../utils/product";
import type { Product } from "../types";

type SearchContextValue = ReturnType<typeof useProductSearch> & {
  handleSearchSubmit: (product?: Product | null) => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { products, setProductsError } = useProductsContext();

  const search = useProductSearch({
    allProducts: products,
    onSearchSettled: () => setProductsError(null),
  });

  const handleSearchSubmit = (product: Product | null = null) => {
    const found = search.handleSearch(product);
    if (found && products.some((item) => item.id === found.id)) {
      search.setResult(null);
      router.push(getProductPageUrl(found), { scroll: false });
    }
  };

  return (
    <SearchContext.Provider value={{ ...search, handleSearchSubmit }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearchContext must be used within SearchProvider");
  return ctx;
}
