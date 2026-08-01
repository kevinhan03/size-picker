import type { Metadata } from "next";
import { OutfitsPageClient } from "../../src/components/pages/OutfitsPageClient";
import { redirect } from "next/navigation";
import { getInitialAuthState } from "../../server/auth/user-session";
import { listOutfitRequests } from "../../server/services/outfit-requests";

export const metadata: Metadata = { title: "코디 | DIGBOX", robots: { index: false, follow: false } };

export default async function OutfitsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const initialScope = tab === "mine" || tab === "proposed" ? tab : "open";
  const auth = await getInitialAuthState();
  if (!auth.user?.id) redirect(`/login?returnTo=${encodeURIComponent(`/outfits?tab=${initialScope}`)}`);
  const initialData = await listOutfitRequests(auth.user.id, initialScope, null, "all", 20).catch(() => null);
  return <OutfitsPageClient initialScope={initialScope} initialData={initialData} />;
}
