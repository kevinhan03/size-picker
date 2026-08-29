import type { Metadata } from "next";
import { OutfitExplorerPageClient } from "../../src/components/pages/OutfitExplorerPageClient";

export const metadata: Metadata = {
  title: "코디 탐색 | DIGBOX",
  robots: { index: false, follow: false },
};

export default function OutfitExplorerPage() {
  return <OutfitExplorerPageClient />;
}
