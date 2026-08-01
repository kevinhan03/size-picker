import type { Metadata } from "next";
import { NewOutfitRequestPageClient } from "../../../src/components/pages/NewOutfitRequestPageClient";
import { redirect } from "next/navigation";
import { getInitialAuthState } from "../../../server/auth/user-session";
import { getClosetProducts } from "../../../server/services/user-collections";
import { ClosetProvider } from "../../../src/contexts/ClosetContext";

export const metadata: Metadata = { title: "코디 요청하기 | DIGBOX", robots: { index: false, follow: false } };

export default async function NewOutfitRequestPage() {
  const auth = await getInitialAuthState();
  if (!auth.user?.id) redirect("/login?returnTo=%2Foutfits%2Fnew");
  const products = await getClosetProducts(auth.user.id).catch(() => []);
  return <ClosetProvider initialProducts={products}><NewOutfitRequestPageClient /></ClosetProvider>;
}
