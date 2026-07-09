import type { Metadata } from "next";
import { TasteGraphPageClient } from "../../src/components/pages/TasteGraphPageClient";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function TasteGraphPage() {
  return <TasteGraphPageClient />;
}
