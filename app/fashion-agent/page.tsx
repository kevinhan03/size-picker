import type { Metadata } from "next";
import { FashionAgentPageClient } from "../../src/components/pages/FashionAgentPageClient";

export const metadata: Metadata = {
  title: "에이전트 | DIGBOX",
  robots: { index: false, follow: false },
};
export default function FashionAgentPage() {
  return <FashionAgentPageClient />;
}
