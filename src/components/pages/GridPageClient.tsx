"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { GridView } from "../GridView";
import { ProductDetailModal } from "../ProductDetailModal";
import { ImageViewerOverlay } from "../ImageViewerOverlay";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { useProductsContext } from "../../contexts/ProductsContext";
import { useGridState } from "../../hooks/useGridState";
import { getProductPageUrl, toPublicUrl } from "../../utils/product";
import type { Product } from "../../types";

export function GridPageClient() {
  const { products, isProductsLoading } = useProductsContext();
  const { closetProducts, toggleCloset, isInCloset, ensureLoaded: ensureClosetLoaded } = useClosetContext();
  const { toggleDigbox, isInDigbox, ensureLoaded: ensureDigboxLoaded } = useDigboxContext();
  const grid = useGridState(products);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [isDetailImageZoomed, setIsDetailImageZoomed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureClosetLoaded();
    ensureDigboxLoaded();
  }, [ensureClosetLoaded, ensureDigboxLoaded]);

  const normalizedProduct = useMemo<Product | null>(() => {
    if (!selectedProduct) return null;
    const imagePath = String(selectedProduct.imagePath || "").trim();
    const image = imagePath ? toPublicUrl(imagePath) : selectedProduct.image;
    const thumbnailImage = imagePath
      ? toPublicUrl(imagePath, { width: 320, height: 320, quality: 65 })
      : selectedProduct.thumbnailImage;
    return { ...selectedProduct, image, thumbnailImage };
  }, [selectedProduct]);

  useEffect(() => {
    const handlePopState = () => {
      setSelectedProduct(null);
      setActiveRowIndex(null);
      setIsDetailImageZoomed(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
    window.history.pushState(null, "", getProductPageUrl(product));
  };

  const handleClose = () => {
    setSelectedProduct(null);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
    window.history.back();
  };

  const handleRecommendationClick = (product: Product) => {
    setSelectedProduct(product);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
    window.history.replaceState(null, "", getProductPageUrl(product));
  };

  const handleImageLoadError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.style.display = "none";
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--app-main-pt)] text-white">
      <GridView
        allProducts={products}
        filteredGridProducts={grid.filteredGridProducts}
        gridCategoryCounts={grid.gridCategoryCounts}
        gridCategoryFilter={grid.gridCategoryFilter}
        setGridCategoryFilter={grid.setGridCategoryFilter}
        gridSearchQuery={grid.gridSearchQuery}
        setGridSearchQuery={grid.setGridSearchQuery}
        onProductClick={handleProductClick}
        onImageError={handleImageLoadError}
        isLoading={isProductsLoading}
      />

      {normalizedProduct && (
        <ProductDetailModal
          product={normalizedProduct}
          closetProduct={closetProducts.find((item) => item.id === normalizedProduct.id) || null}
          activeRowIndex={activeRowIndex}
          onClose={handleClose}
          onRowClick={(rowIndex) => setActiveRowIndex(rowIndex)}
          onRecommendationClick={handleRecommendationClick}
          onZoomImage={() => setIsDetailImageZoomed(true)}
          onImageError={handleImageLoadError}
          modalRef={modalRef}
          onToggleCloset={(selection) => toggleCloset(normalizedProduct.id, selection)}
          isInCloset={isInCloset(normalizedProduct.id)}
          onToggleDigbox={() => toggleDigbox(normalizedProduct.id)}
          isInDigbox={isInDigbox(normalizedProduct.id)}
        />
      )}

      {normalizedProduct && <ImageViewerOverlay open={isDetailImageZoomed} src={normalizedProduct.image} alt={normalizedProduct.name} onClose={() => setIsDetailImageZoomed(false)} />}
    </main>
  );
}
