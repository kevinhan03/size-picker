"use client";

import { useMemo, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { ProductDetailModal } from "./ProductDetailModal";
import { useSearchContext } from "../contexts/SearchContext";
import { useProductsContext } from "../contexts/ProductsContext";
import { getProductPageUrl } from "../utils/product";
import { computeSizeRecommendations } from "../utils/sizeTable";
import { smoothScrollTo } from "../utils/scroll";
import type { SizeRecommendation } from "../types";

export function SearchResultOverlay() {
  const router = useRouter();
  const { products } = useProductsContext();
  const search = useSearchContext();
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const recommendationsRef = useRef<HTMLDivElement>(null);

  const showModal = Boolean(search.result && !products.some((p) => p.id === search.result?.id));

  const recommendations = useMemo<SizeRecommendation[]>(() => {
    if (activeRowIndex === null || !search.result) return [];
    return computeSizeRecommendations(search.result, activeRowIndex, products);
  }, [activeRowIndex, search.result, products]);

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
        recommendations={recommendations}
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
        recommendationsRef={recommendationsRef}
        smoothScrollTo={smoothScrollTo}
      />
      {isImageZoomed && search.result && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setIsImageZoomed(false)}
          onTouchStart={() => setIsImageZoomed(false)}
        >
          <div className="flex h-[63vh] w-full max-w-6xl items-center justify-center">
            <img
              src={search.result.image}
              alt={search.result.name}
              className="max-h-full max-w-full cursor-pointer object-contain"
              style={{ borderRadius: "20px" }}
            />
          </div>
        </div>
      )}
    </>
  );
}
