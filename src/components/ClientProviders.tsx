"use client";

import { AuthProvider } from "../contexts/AuthContext";
import { ClosetProvider } from "../contexts/ClosetContext";
import { DigboxProvider } from "../contexts/DigboxContext";
import { MySizesProvider } from "../contexts/MySizesContext";
import { ProductFormProvider } from "../contexts/ProductFormContext";
import { ProductsProvider } from "../contexts/ProductsContext";
import { SearchProvider } from "../contexts/SearchContext";
import type { Product } from "../types";
import { AppShell } from "./AppShell";
import { PostHogProvider } from "./PostHogProvider";

export function ClientProviders({
  children,
  initialProducts = [],
}: {
  children: React.ReactNode;
  initialProducts?: Product[];
}) {
  return (
    <PostHogProvider>
      <AuthProvider>
        <ProductsProvider initialProducts={initialProducts}>
          <ClosetProvider>
            <MySizesProvider>
              <DigboxProvider>
              <SearchProvider>
                <ProductFormProvider>
                  <AppShell>{children}</AppShell>
                </ProductFormProvider>
              </SearchProvider>
              </DigboxProvider>
            </MySizesProvider>
          </ClosetProvider>
        </ProductsProvider>
      </AuthProvider>
    </PostHogProvider>
  );
}
