import { RouteLoadingSkeleton } from "../../src/components/RouteLoadingSkeleton";
import { getRequestLocale } from "../../server/utils/locale";
import { translate } from "../../src/i18n/messages";

export default async function Loading() {
  const locale = await getRequestLocale();
  return <RouteLoadingSkeleton eyebrow="TASTE" title={translate(locale, "tasteGraph.readingTaste")} variant="taste" locale={locale} />;
}
