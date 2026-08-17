import type { Metadata } from "next";
import { OutfitsPageClient } from "../../src/components/pages/OutfitsPageClient";
import { getInitialAuthState } from "../../server/auth/user-session";
import { listOutfitRequests } from "../../server/services/outfit-requests";

export const metadata: Metadata = { title: "코디 | DIGBOX", robots: { index: false, follow: false } };

export default async function OutfitsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const requestedScope = tab === "mine" || tab === "proposed" ? tab : "open";
  const auth = await getInitialAuthState();
  const initialScope = auth.user?.id ? requestedScope : "open";
  const initialData = await listOutfitRequests(auth.user?.id || null, initialScope, null, "all", 20).catch(() => null);
  return <OutfitsPageClient initialScope={initialScope} initialData={initialData} />;
}
