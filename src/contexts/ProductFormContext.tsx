"use client";

import { createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useProductForm } from "../hooks/useProductForm";
import { useAuthContext } from "./AuthContext";
import { useClosetContext } from "./ClosetContext";
import { useDigboxContext } from "./DigboxContext";
import { useProductsContext } from "./ProductsContext";

type ProductFormContextValue = ReturnType<typeof useProductForm>;

const ProductFormContext = createContext<ProductFormContextValue | null>(null);
const EMPTY_PRODUCT_URLS = new Set<string>();

export function ProductFormProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuthContext();
  const products = useProductsContext();
  const digbox = useDigboxContext();
  const closet = useClosetContext();
  const value = useProductForm({
    productUrlSet: EMPTY_PRODUCT_URLS,
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
