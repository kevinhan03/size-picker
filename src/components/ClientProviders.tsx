"use client";

import { AuthProvider } from "../contexts/AuthContext";
import { ClosetProvider } from "../contexts/ClosetContext";
import { DigboxProvider } from "../contexts/DigboxContext";
import { ProductFormProvider } from "../contexts/ProductFormContext";
import { SearchProvider } from "../contexts/SearchContext";
import { LocaleProvider } from "../contexts/LocaleContext";
import { AppShell } from "./AppShell";
import { PostHogProvider } from "./PostHogProvider";
import type { AuthInitialState } from "../types";
import type { Locale } from "../i18n/locale";

export function ClientProviders({ children, initialAuth, initialLocale }: { children: React.ReactNode; initialAuth: AuthInitialState; initialLocale: Locale }) {
  return (
    <PostHogProvider>
      <LocaleProvider initialLocale={initialLocale}>
        <AuthProvider initialState={initialAuth}>
          <ClosetProvider>
              <DigboxProvider>
                <SearchProvider>
                  <ProductFormProvider>
                    <AppShell>{children}</AppShell>
                  </ProductFormProvider>
                </SearchProvider>
              </DigboxProvider>
          </ClosetProvider>
        </AuthProvider>
      </LocaleProvider>
    </PostHogProvider>
  );
}
