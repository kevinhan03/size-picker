"use client";

import { AuthProvider } from "../contexts/AuthContext";
import { ClosetProvider } from "../contexts/ClosetContext";
import { DigboxProvider } from "../contexts/DigboxContext";
import { CollectionBootstrapProvider } from "../contexts/CollectionBootstrapContext";
import { NavigationProgressProvider } from "../contexts/NavigationProgressContext";
import { ProductFormProvider } from "../contexts/ProductFormContext";
import { SearchProvider } from "../contexts/SearchContext";
import { LocaleProvider } from "../contexts/LocaleContext";
import { AppShell } from "./AppShell";
import { PostHogProvider } from "./PostHogProvider";
import { NavigationPrefetcher } from "./NavigationPrefetcher";
import type { AuthInitialState } from "../types";
import type { Locale } from "../i18n/locale";

export function ClientProviders({ children, initialAuth, initialLocale }: { children: React.ReactNode; initialAuth: AuthInitialState; initialLocale: Locale }) {
  return (
    <PostHogProvider>
      <LocaleProvider initialLocale={initialLocale}>
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
      </LocaleProvider>
    </PostHogProvider>
  );
}
