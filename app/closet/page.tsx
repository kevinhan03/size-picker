import type { Metadata } from "next";
import { ClosetPageClient } from "../../src/components/pages/ClosetPageClient";
import type { Product } from "../../src/types";
import { getInitialAuthState } from "../../server/auth/user-session";
import { getClosetProducts } from "../../server/services/user-collections";

export const metadata: Metadata = {
  title: "내 옷장 | DIGBOX",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ClosetPage() {
  const auth = await getInitialAuthState();
  let initialProducts: Product[] | undefined;
  if (auth.user?.id) {
    try {
      initialProducts = await getClosetProducts(auth.user.id);
    } catch {
      // The client retries through /api/closet when the server read fails.
    }
  }

  return <ClosetPageClient initialProducts={initialProducts} />;
}
