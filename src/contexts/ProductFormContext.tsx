"use client";

import { createContext, useContext, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useProductForm } from "../hooks/useProductForm";
import { normalizeComparableProductUrl } from "../utils/product";
import { useAuthContext } from "./AuthContext";
import { useClosetContext } from "./ClosetContext";
import { useDigboxContext } from "./DigboxContext";
import { useProductsContext } from "./ProductsContext";

type ProductFormContextValue = ReturnType<typeof useProductForm>;

const ProductFormContext = createContext<ProductFormContextValue | null>(null);

export function ProductFormProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuthContext();
  const products = useProductsContext();
  const digbox = useDigboxContext();
  const closet = useClosetContext();
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
    onAddToDigbox: digbox.addToDigbox,
    onAddToCloset: closet.addToCloset,
    isLoggedIn: Boolean(auth.authUser) || Boolean(pathname?.startsWith("/admin")),
    onLoginRequired: () => router.push("/login"),
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
