"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLocale, type Locale } from "../i18n/locale";
import { translate, type MessageKey } from "../i18n/messages";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale: Locale }) {
  const router = useRouter();
  const [locale, setCurrentLocale] = useState(initialLocale);

  useEffect(() => {
    setCurrentLocale(initialLocale);
  }, [initialLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(async (nextLocale: Locale) => {
    const normalizedLocale = getLocale(nextLocale);
    if (normalizedLocale === locale) return;

    const response = await fetch("/api/locale", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: normalizedLocale }),
    });
    if (!response.ok) throw new Error(translate(locale, "locale.switchError"));

    setCurrentLocale(normalizedLocale);
    router.refresh();
  }, [locale, router]);

  return <LocaleContext.Provider value={{ locale, setLocale, t: (key, values) => translate(locale, key, values) }}>{children}</LocaleContext.Provider>;
}

export function useLocaleContext() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocaleContext must be used within LocaleProvider");
  return context;
}
