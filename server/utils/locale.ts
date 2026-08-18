import { cookies } from "next/headers";
import { getLocale, LOCALE_COOKIE_NAME, type Locale } from "../../src/i18n/locale";

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return getLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
}
