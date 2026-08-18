"use client";

import { AuthProvider } from "../contexts/AuthContext";
import { ClosetProvider } from "../contexts/ClosetContext";
import { DigboxProvider } from "../contexts/DigboxContext";
import { CollectionBootstrapProvider } from "../contexts/CollectionBootstrapContext";
import { ProductFormProvider } from "../contexts/ProductFormContext";
import { SearchProvider } from "../contexts/SearchContext";
import { AppShell } from "./AppShell";
import { PostHogProvider } from "./PostHogProvider";
import type { AuthInitialState } from "../types";

export function ClientProviders({ children, initialAuth }: { children: React.ReactNode; initialAuth: AuthInitialState }) {
  return (
    <PostHogProvider>
      <AuthProvider initialState={initialAuth}>
        <CollectionBootstrapProvider>
          <ClosetProvider>
            <DigboxProvider>
              <SearchProvider>
                <ProductFormProvider>
                  <AppShell>{children}</AppShell>
                </ProductFormProvider>
              </SearchProvider>
            </DigboxProvider>
          </ClosetProvider>
        </CollectionBootstrapProvider>
      </AuthProvider>
    </PostHogProvider>
  );
}
