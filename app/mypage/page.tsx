import type { Metadata } from "next";
import { MyPageClient } from "../../src/components/pages/MyPageClient";
import { redirect } from "next/navigation";
import { getInitialAuthState } from "../../server/auth/user-session";
import { getClosetProducts, getMySizes, getUserDiscoveries } from "../../server/services/user-collections";
import { ClosetProvider } from "../../src/contexts/ClosetContext";
import { MySizesProvider } from "../../src/contexts/MySizesContext";

export const metadata: Metadata = {
  title: "마이페이지 | DIGBOX",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function MyPageRoute() {
  const auth = await getInitialAuthState();
  if (!auth.user?.id) redirect("/login");
  const [closetProducts, mySizes, discovery] = await Promise.all([
    getClosetProducts(auth.user.id).catch(() => []),
    getMySizes(auth.user.id).catch(() => []),
    getUserDiscoveries(auth.user.id).catch(() => ({ products: [], totalSaveCount: 0 })),
  ]);
  return (
    <ClosetProvider initialProducts={closetProducts}>
      <MySizesProvider initialProfiles={mySizes}>
        <MyPageClient initialDiscoveries={discovery.products} initialDiscoveryTotalSaveCount={discovery.totalSaveCount} />
      </MySizesProvider>
    </ClosetProvider>
  );
}
