import type { Metadata } from "next";
import { DigMatchPageClient } from "../../src/components/pages/DigMatchPageClient";

export const metadata: Metadata = {
  title: "DIG MATCH | DIGBOX",
  description: "상품을 비교하며 나만의 취향을 발견하세요.",
  robots: { index: false, follow: false },
};

export default function DigMatchPage() {
  return <DigMatchPageClient />;
}
