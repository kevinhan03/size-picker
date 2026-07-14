import type { Metadata } from "next";
import { OutfitsPageClient } from "../../src/components/pages/OutfitsPageClient";

export const metadata: Metadata = { title: "코디 | DIGBOX", robots: { index: false, follow: false } };

export default function OutfitsPage() {
  return <OutfitsPageClient />;
}
