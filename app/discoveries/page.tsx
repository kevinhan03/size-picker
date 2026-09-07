import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DiscoveriesPageClient } from "../../src/components/pages/DiscoveriesPageClient";
import { getInitialAuthState } from "../../server/auth/user-session";
import { getUserDiscoveries } from "../../server/services/user-collections";
import { buildLoginHref } from "../../src/utils/authNavigation";

export const metadata: Metadata = {
  title: "발굴 성과 | DIGBOX",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DiscoveriesPage() {
  const auth = await getInitialAuthState();
  if (!auth.user?.id) redirect(buildLoginHref("login", "/discoveries"));
  if (!auth.username) redirect("/onboarding/username");

  let initialData = null;
  let initialError = false;
  try {
    initialData = await getUserDiscoveries(auth.user.id);
  } catch {
    initialError = true;
  }

  return (
    <DiscoveriesPageClient
      initialData={initialData}
      initialError={initialError}
      profileHref={`/${encodeURIComponent(auth.username)}`}
    />
  );
}
