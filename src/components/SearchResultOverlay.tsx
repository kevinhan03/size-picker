"use client";

import { useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { ProductDetailModal } from "./ProductDetailModal";
import { ImageViewerOverlay } from "./ImageViewerOverlay";
import { useSearchContext } from "../contexts/SearchContext";
import { useProductsContext } from "../contexts/ProductsContext";
import { getProductPageUrl } from "../utils/product";

export function SearchResultOverlay() {
  const router = useRouter();
  const { products } = useProductsContext();
  const search = useSearchContext();
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const showModal = Boolean(search.result && !products.some((p) => p.id === search.result?.id));

  const handleImageLoadError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.style.display = "none";
  };

  if (!showModal) return null;

  return (
    <>
      <ProductDetailModal
        product={search.result!}
        activeRowIndex={activeRowIndex}
        onClose={() => {
          setActiveRowIndex(null);
          setIsImageZoomed(false);
          search.setResult(null);
        }}
        onRowClick={(rowIndex) => setActiveRowIndex(rowIndex)}
        onRecommendationClick={(product) => {
          setActiveRowIndex(null);
          setIsImageZoomed(false);
          if (products.some((item) => item.id === product.id)) {
            search.setResult(null);
            router.push(getProductPageUrl(product), { scroll: false });
            return;
          }
          search.setResult(product);
        }}
        onZoomImage={() => setIsImageZoomed(true)}
        onImageError={handleImageLoadError}
        modalRef={modalRef}
      />
      {search.result && (
        <ImageViewerOverlay
          open={isImageZoomed}
          src={search.result.image}
          alt={search.result.name}
          onClose={() => setIsImageZoomed(false)}
        />
      )}
    </>
  );
}
