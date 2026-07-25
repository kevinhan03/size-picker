import type { Metadata } from "next";
import { SimilarProductsPageClient } from "../../../../src/components/pages/SimilarProductsPageClient";

export const metadata: Metadata = {
  title: "비슷한 상품 | DIGBOX",
};

export default async function SimilarProductsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SimilarProductsPageClient id={id} />;
}
