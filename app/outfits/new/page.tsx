import type { Metadata } from "next";
import { NewOutfitRequestPageClient } from "../../../src/components/pages/NewOutfitRequestPageClient";

export const metadata: Metadata = { title: "코디 요청하기 | DIGBOX", robots: { index: false, follow: false } };

export default function NewOutfitRequestPage() {
  return <NewOutfitRequestPageClient />;
}
