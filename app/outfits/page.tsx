import type { Metadata } from "next";
import { OutfitsPageClient } from "../../src/components/pages/OutfitsPageClient";

export const metadata: Metadata = { title: "코디 | DIGBOX", robots: { index: false, follow: false } };

export default async function OutfitsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  return <OutfitsPageClient initialScope={tab === "mine" || tab === "proposed" ? tab : "open"} />;
}
