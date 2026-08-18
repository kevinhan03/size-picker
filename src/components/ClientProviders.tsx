"use client";

import { AuthProvider } from "../contexts/AuthContext";
import { ClosetProvider } from "../contexts/ClosetContext";
import { DigboxProvider } from "../contexts/DigboxContext";
import { CollectionBootstrapProvider } from "../contexts/CollectionBootstrapContext";
import { NavigationProgressProvider } from "../contexts/NavigationProgressContext";
import { ProductFormProvider } from "../contexts/ProductFormContext";
import { SearchProvider } from "../contexts/SearchContext";
import { AppShell } from "./AppShell";
import { PostHogProvider } from "./PostHogProvider";
import { NavigationPrefetcher } from "./NavigationPrefetcher";
import type { AuthInitialState } from "../types";

export function ClientProviders({ children, initialAuth }: { children: React.ReactNode; initialAuth: AuthInitialState }) {
  return (
    <PostHogProvider>
      <AuthProvider initialState={initialAuth}>
        <CollectionBootstrapProvider>
          <NavigationPrefetcher />
          <ClosetProvider>
            <DigboxProvider>
              <SearchProvider>
                <ProductFormProvider>
                  <NavigationProgressProvider><AppShell>{children}</AppShell></NavigationProgressProvider>
                </ProductFormProvider>
              </SearchProvider>
            </DigboxProvider>
          </ClosetProvider>
        </CollectionBootstrapProvider>
      </AuthProvider>
    </PostHogProvider>
  );
}
