import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAllProducts } from "../api";
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

export function useProducts(initialProducts: Product[] = []) {
  const initial = splitProducts(initialProducts);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>(initial.normal);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(initial.featured);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const didInitRef = useRef(initialProducts.length > 0);

  const retryProductsLoad = useCallback(() => {
    setRetryTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (retryTrigger === 0 && didInitRef.current) {
      return;
    }

    let isActive = true;

    const load = async () => {
      try {
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
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [retryTrigger]);

  return {
    products,
    featuredProducts,
    productsError,
    setProductsError,
    retryProductsLoad,
  };
}
