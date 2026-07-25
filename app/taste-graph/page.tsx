import type { Metadata } from "next";
import { TasteGraphPageClient } from "../../src/components/pages/TasteGraphPageClient";

export const metadata: Metadata = {
  title: "취향 분석 | DIGBOX",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TasteGraphPage() {
  return <TasteGraphPageClient />;
}
