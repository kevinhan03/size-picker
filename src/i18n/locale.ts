export const LOCALE_COOKIE_NAME = "digbox_locale";

export const supportedLocales = ["ko", "en"] as const;

export type Locale = (typeof supportedLocales)[number];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && supportedLocales.includes(value as Locale);
}

export function getLocale(value: unknown): Locale {
  return isLocale(value) ? value : "ko";
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === "ko" ? "en" : "ko";
}
