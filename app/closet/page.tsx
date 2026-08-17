import type { Metadata } from "next";
import { ClosetPageClient } from "../../src/components/pages/ClosetPageClient";
import type { Product } from "../../src/types";
import { getInitialAuthState } from "../../server/auth/user-session";
import { getClosetProducts } from "../../server/services/user-collections";
import { redirect } from "next/navigation";
import { buildLoginHref } from "../../src/utils/authNavigation";

export const metadata: Metadata = {
  title: "내 옷장 | DIGBOX",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ClosetPage() {
  const auth = await getInitialAuthState();
  if (!auth.user?.id) redirect(buildLoginHref("login", "/closet", "closet"));

  let initialProducts: Product[] | undefined;
  try {
    initialProducts = await getClosetProducts(auth.user.id);
  } catch {
    // The client retries through /api/closet when the server read fails.
  }

  return <ClosetPageClient initialProducts={initialProducts} />;
}
