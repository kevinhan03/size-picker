import { CollectionLoadingSkeleton } from "../../src/components/CollectionLoadingSkeleton";
import { getRequestLocale } from "../../server/utils/locale";
import { translate } from "../../src/i18n/messages";

export default async function Loading() {
  const locale = await getRequestLocale();
  return <CollectionLoadingSkeleton eyebrow="MY SAVED" title={translate(locale, "saved.title")} locale={locale} />;
}
