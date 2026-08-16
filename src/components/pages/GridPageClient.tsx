"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import dynamic from "next/dynamic";
import { GridView } from "../GridView";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { useProductsContext } from "../../contexts/ProductsContext";
import { useGridState } from "../../hooks/useGridState";
import { useProductDetail } from "../../hooks/useProductDetail";
import { useProductModalQuery } from "../../hooks/useProductModalQuery";
import { toPublicUrl } from "../../utils/product";
import type { Product } from "../../types";
import { loadProductDetailModal } from "../productDetailModalLoader";

const ProductDetailModal = dynamic(loadProductDetailModal, { ssr: false });
const ImageViewerOverlay = dynamic(() => import("../ImageViewerOverlay").then((module) => module.ImageViewerOverlay), { ssr: false });

export function GridPageClient() {
  const { products, isProductsLoading } = useProductsContext();
  const { closetProducts, toggleCloset, isInCloset, ensureLoaded: ensureClosetLoaded } = useClosetContext();
  const { toggleDigbox, isInDigbox, ensureLoaded: ensureDigboxLoaded } = useDigboxContext();
  const grid = useGridState(products);
  const productModal = useProductModalQuery();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [isDetailImageZoomed, setIsDetailImageZoomed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const detailedProduct = useProductDetail(productModal.productId, selectedProduct);

  useEffect(() => {
    ensureClosetLoaded();
    ensureDigboxLoaded();
  }, [ensureClosetLoaded, ensureDigboxLoaded]);

  const normalizedProduct = useMemo<Product | null>(() => {
    if (!detailedProduct) return null;
    const imagePath = String(detailedProduct.imagePath || "").trim();
    const image = imagePath ? toPublicUrl(imagePath) : detailedProduct.image;
    const thumbnailImage = imagePath
      ? toPublicUrl(imagePath, { width: 320, height: 320, quality: 65 })
      : detailedProduct.thumbnailImage;
    return { ...detailedProduct, image, thumbnailImage };
  }, [detailedProduct]);

  useEffect(() => {
    if (!productModal.productId) {
      setSelectedProduct(null);
      setActiveRowIndex(null);
      setIsDetailImageZoomed(false);
      return;
    }

    const product = products.find((item) => item.id === productModal.productId);
    if (product) setSelectedProduct(product);
  }, [productModal.productId, products]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
    productModal.openProduct(product.id);
  };

  const handleClose = () => {
    productModal.closeProduct();
    setSelectedProduct(null);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
  };

  const handleRecommendationClick = (product: Product) => {
    setSelectedProduct(product);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
    productModal.openProduct(product.id, true);
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
