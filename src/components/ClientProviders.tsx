"use client";

import { AuthProvider } from "../contexts/AuthContext";
import { ProductFormProvider } from "../contexts/ProductFormContext";
import { ProductsProvider } from "../contexts/ProductsContext";
import type { Product } from "../types";
import { AppShell } from "./AppShell";

export function ClientProviders({
  children,
  initialProducts = [],
}: {
  children: React.ReactNode;
  initialProducts?: Product[];
}) {
  return (
    <AuthProvider>
      <ProductsProvider initialProducts={initialProducts}>
        <ProductFormProvider>
          <AppShell>{children}</AppShell>
        </ProductFormProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}
