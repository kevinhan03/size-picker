import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAllProducts, fetchCatalogProducts } from "../api";
import type { Product } from "../types";

const getProductTime = (product: Product) => {
  const time = product.createdAt ? Date.parse(product.createdAt) : 0;
  return Number.isFinite(time) ? time : 0;
};

const sortFeaturedProducts = (items: Product[]) =>
  [...items].sort((a, b) => {
    const aOrder = typeof a.instagramOrder === "number" ? a.instagramOrder : Number.POSITIVE_INFINITY;
    const bOrder = typeof b.instagramOrder === "number" ? b.instagramOrder : Number.POSITIVE_INFINITY;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return getProductTime(b) - getProductTime(a);
  });

const splitProducts = (all: Product[]) => ({
  normal: all,
  featured: sortFeaturedProducts(all.filter((p) => p.isInstagram)),
});

export function useProducts(initialProducts: Product[] = [], { enabled = true, catalog = false }: { enabled?: boolean; catalog?: boolean } = {}) {
  const initial = splitProducts(initialProducts);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>(initial.normal);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(initial.featured);
  const [isProductsLoading, setIsProductsLoading] = useState(enabled && initialProducts.length === 0);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [nextCatalogOffset, setNextCatalogOffset] = useState<number | null>(catalog ? 0 : null);
  const [isLoadingMoreProducts, setIsLoadingMoreProducts] = useState(false);
  const didInitRef = useRef(initialProducts.length > 0);
  const isLoadingMoreRef = useRef(false);

  const retryProductsLoad = useCallback(() => {
    setRetryTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsProductsLoading(false);
      setProductsError(null);
      return;
    }

    if (retryTrigger === 0 && didInitRef.current) {
      return;
    }

    let isActive = true;

    const load = async () => {
      setIsProductsLoading(true);
      try {
        if (catalog) {
          const loaded = await fetchCatalogProducts(0);
          if (!isActive) return;
          const split = splitProducts(loaded.products);
          setProducts(split.normal);
          setFeaturedProducts(split.featured);
          setNextCatalogOffset(loaded.nextOffset);
          setProductsError(null);
          return;
        }
        const loaded = await fetchAllProducts();
        if (!isActive) return;
        const split = splitProducts(loaded);
        setProducts(split.normal);
        setFeaturedProducts(split.featured);
        setProductsError(null);
      } catch (loadError: unknown) {
        if (!isActive) return;
        const message =
          loadError instanceof Error ? loadError.message : "상품 정보를 불러오는 중 오류가 발생했습니다.";
        setProductsError(message);
      } finally {
        if (isActive) setIsProductsLoading(false);
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [catalog, enabled, retryTrigger]);

  const loadMoreProducts = useCallback(async () => {
    if (!catalog || nextCatalogOffset === null || isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;
    setIsLoadingMoreProducts(true);
    try {
      const loaded = await fetchCatalogProducts(nextCatalogOffset);
      const split = splitProducts(loaded.products);
      setProducts((current) => [...current, ...split.normal]);
      setFeaturedProducts((current) => sortFeaturedProducts([...current, ...split.featured]));
      setNextCatalogOffset(loaded.nextOffset);
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMoreProducts(false);
    }
  }, [catalog, nextCatalogOffset]);

  return {
    products,
    featuredProducts,
    isProductsLoading,
    productsError,
    setProductsError,
    retryProductsLoad,
    hasMoreProducts: catalog && nextCatalogOffset !== null,
    isLoadingMoreProducts,
    loadMoreProducts,
  };
}
