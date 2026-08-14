import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CatalogPageContent } from "../../../src/components/pages/CatalogPageContent";
import { ProductModalClient } from "../../../src/components/ProductModalClient";
import {
  buildProductMetadata,
  fetchProduct,
  resolveImageUrl,
} from "../../../server/utils/product-detail";

export const revalidate = 3600;
export const dynamic = "force-static";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return buildProductMetadata(await fetchProduct(id));
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await fetchProduct(id);
  if (!product) notFound();

  const imageUrl = resolveImageUrl(product.imagePath || product.image || "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand },
    category: product.category,
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(product.url && product.url !== "#" ? { url: product.url } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        suppressHydrationWarning
      />
      <CatalogPageContent />
      <ProductModalClient id={id} initialProduct={product} closeHref="/" />
    </>
  );
}
