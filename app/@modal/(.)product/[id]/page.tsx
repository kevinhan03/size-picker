import { notFound } from "next/navigation";
import { ProductDetailRouteModal } from "../../../../src/components/ProductDetailRouteModal";
import { fetchProduct } from "../../../../server/utils/product-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductModalPage({ params }: Props) {
  const { id } = await params;
  const product = await fetchProduct(id);
  if (!product) notFound();

  return <ProductDetailRouteModal product={product} />;
}
