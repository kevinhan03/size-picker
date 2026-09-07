import { ProfileLoadingSkeleton } from "../../src/components/ProfileLoadingSkeleton";
import { getRequestLocale } from "../../server/utils/locale";

export default async function Loading() {
  const locale = await getRequestLocale();
  return <ProfileLoadingSkeleton locale={locale} />;
}
