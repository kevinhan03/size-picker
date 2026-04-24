"use client";

import { useMemo, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { ProductDetailModal } from "./ProductDetailModal";
import { useClosetContext } from "../contexts/ClosetContext";
import { useProductsContext } from "../contexts/ProductsContext";
import type { Product, SizeRecommendation } from "../types";
import { getProductPageUrl, toPublicUrl } from "../utils/product";
import { computeSizeRecommendations } from "../utils/sizeTable";
import { smoothScrollTo } from "../utils/scroll";

export function ProductDetailRouteModal({ product }: { product: Product }) {
  const router = useRouter();
  const { products } = useProductsContext();
  const { toggleCloset, isInCloset } = useClosetContext();
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [isDetailImageZoomed, setIsDetailImageZoomed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const recommendationsRef = useRef<HTMLDivElement>(null);

  const recommendations = useMemo<SizeRecommendation[]>(() => {
    if (activeRowIndex === null) return [];
    return computeSizeRecommendations(product, activeRowIndex, products);
  }, [activeRowIndex, product, products]);

  const normalizedProduct = useMemo<Product>(() => {
    const imagePath = String(product.imagePath || "").trim();
    const image = imagePath ? toPublicUrl(imagePath) : product.image;
    const thumbnailImage = imagePath ? toPublicUrl(imagePath, { width: 320, height: 320, quality: 65 }) : product.thumbnailImage;
    return {
      ...product,
      image,
      thumbnailImage,
    };
  }, [product]);

  const handleImageLoadError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.style.display = "none";
  };

  return (
    <>
      <ProductDetailModal
        product={normalizedProduct}
        activeRowIndex={activeRowIndex}
        onClose={() => router.back()}
        onRowClick={(rowIndex) => setActiveRowIndex(rowIndex)}
        recommendations={recommendations}
        onRecommendationClick={(nextProduct) => {
          setActiveRowIndex(null);
          setIsDetailImageZoomed(false);
          router.replace(getProductPageUrl(nextProduct), { scroll: false });
        }}
        onZoomImage={() => setIsDetailImageZoomed(true)}
        onImageError={handleImageLoadError}
        modalRef={modalRef}
        recommendationsRef={recommendationsRef}
        smoothScrollTo={smoothScrollTo}
        onToggleCloset={() => toggleCloset(normalizedProduct.id)}
        isInCloset={isInCloset(normalizedProduct.id)}
      />

      {isDetailImageZoomed && (
        <div
          className="fixed inset-0 z-[75] bg-black/90 backdrop-blur-sm p-4 flex items-center justify-center cursor-pointer"
          onClick={() => setIsDetailImageZoomed(false)}
          onTouchStart={() => setIsDetailImageZoomed(false)}
        >
          <div className="h-[63vh] w-full max-w-6xl flex items-center justify-center">
            <img
              src={normalizedProduct.image}
              alt={normalizedProduct.name}
              className="max-w-full max-h-full object-contain cursor-pointer"
              style={{ borderRadius: "20px" }}
            />
          </div>
        </div>
      )}
    </>
  );
}
