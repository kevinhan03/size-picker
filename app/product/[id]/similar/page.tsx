import type { Metadata } from "next";
import { SimilarProductsPageClient } from "../../../../src/components/pages/SimilarProductsPageClient";
import { getProductRecommendationData } from "../../../../server/services/product-recommendations";

export const metadata: Metadata = {
  title: "비슷한 상품 | DIGBOX",
};

export default async function SimilarProductsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const normalizedId = String(id).match(/^\d+/)?.[0] || "";
  const initialData = normalizedId ? await getProductRecommendationData(normalizedId).catch(() => null) : null;
  return <SimilarProductsPageClient id={id} initialData={initialData} />;
}
