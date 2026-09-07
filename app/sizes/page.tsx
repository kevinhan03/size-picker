import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MySizesPageClient } from "../../src/components/pages/MySizesPageClient";
import { MySizesProvider } from "../../src/contexts/MySizesContext";
import { getInitialAuthState } from "../../server/auth/user-session";
import { getClosetProducts, getMySizes } from "../../server/services/user-collections";
import { buildLoginHref } from "../../src/utils/authNavigation";

export const metadata: Metadata = {
  title: "내 기준 사이즈 관리 | DIGBOX",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function MySizesPage() {
  const auth = await getInitialAuthState();
  if (!auth.user?.id) redirect(buildLoginHref("login", "/sizes"));
  if (!auth.username) redirect("/onboarding/username");

  const [closetProducts, mySizes] = await Promise.all([
    getClosetProducts(auth.user.id),
    getMySizes(auth.user.id),
  ]);

  return (
    <MySizesProvider initialProfiles={mySizes}>
      <MySizesPageClient
        closetProducts={closetProducts}
        profileHref={`/${encodeURIComponent(auth.username)}`}
      />
    </MySizesProvider>
  );
}
