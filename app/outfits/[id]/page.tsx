import type { Metadata } from "next";
import { OutfitRequestDetailPageClient } from "../../../src/components/pages/OutfitRequestDetailPageClient";

export const metadata: Metadata = { title: "코디 요청 | DIGBOX", robots: { index: false, follow: false } };

export default async function OutfitRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OutfitRequestDetailPageClient requestId={id} />;
}
