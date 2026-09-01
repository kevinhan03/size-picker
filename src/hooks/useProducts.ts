import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAllProducts, fetchCatalogProducts } from "../api";
import { useLocaleContext } from "../contexts/LocaleContext";
import type { Product } from "../types";
import { PRODUCT_CREATED_EVENT } from "../utils/productUpdates";

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

const ANALYSIS_POLL_INTERVAL_MS = 2500;
const ANALYSIS_POLL_MAX_ATTEMPTS = 48;

const isAnalysisFinished = (product: Product) =>
  product.categoryAnalysisStatus === "failed" ||
  product.styleAxisAnalysisStatus === "failed" ||
  (product.categoryAnalysisStatus === "completed" && product.styleAxisAnalysisStatus === "tagged");

export function useProducts(
  initialProducts: Product[] = [],
  {
    enabled = true,
    catalog = false,
    initialNextOffset,
    initialError = null,
  }: { enabled?: boolean; catalog?: boolean; initialNextOffset?: number | null; initialError?: string | null } = {},
) {
  const { t } = useLocaleContext();
  const tRef = useRef(t);
  tRef.current = t;
  const initial = splitProducts(initialProducts);
  const [productsError, setProductsError] = useState<string | null>(initialError);
  const [products, setProducts] = useState<Product[]>(initial.normal);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(initial.featured);
  const [isProductsLoading, setIsProductsLoading] = useState(enabled && initialProducts.length === 0);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [nextCatalogOffset, setNextCatalogOffset] = useState<number | null>(
    catalog ? (initialProducts.length > 0 ? (initialNextOffset ?? null) : 0) : null,
  );
  const [isLoadingMoreProducts, setIsLoadingMoreProducts] = useState(false);
  const didInitRef = useRef(initialProducts.length > 0);
  const isLoadingMoreRef = useRef(false);

  const retryProductsLoad = useCallback(() => {
    setRetryTrigger((prev) => prev + 1);
  }, []);

  const upsertProduct = useCallback((product: Product) => {
    setProducts((current) => [product, ...current.filter((item) => item.id !== product.id)]);
    setFeaturedProducts((current) => sortFeaturedProducts([
      ...(product.isInstagram ? [product] : []),
      ...current.filter((item) => item.id !== product.id),
    ]));
  }, []);

  useEffect(() => {
    let active = true;
    const timers = new Set<number>();

    const trackAnalysis = (productId: string) => {
      let attempts = 0;
      const check = async () => {
        if (!active || attempts >= ANALYSIS_POLL_MAX_ATTEMPTS) return;
        attempts += 1;
        try {
          const response = await fetch(`/api/products/${encodeURIComponent(productId)}?fresh=1`, { cache: "no-store" });
          const payload = await response.json();
          const product = payload?.ok ? payload?.data?.product as Product | undefined : undefined;
          if (product) {
            upsertProduct(product);
            if (isAnalysisFinished(product)) return;
          }
        } catch {
          // A transient polling failure should not remove the just-added card.
        }
        if (active && attempts < ANALYSIS_POLL_MAX_ATTEMPTS) {
          const timer = window.setTimeout(check, ANALYSIS_POLL_INTERVAL_MS);
          timers.add(timer);
        }
      };
      void check();
    };

    const handleProductCreated = (event: Event) => {
      const product = (event as CustomEvent<Product>).detail;
      if (!product?.id) return;
      upsertProduct(product);
      if (!isAnalysisFinished(product)) trackAnalysis(product.id);
    };

    window.addEventListener(PRODUCT_CREATED_EVENT, handleProductCreated);
    return () => {
      active = false;
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener(PRODUCT_CREATED_EVENT, handleProductCreated);
    };
  }, [upsertProduct]);

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
        const message = loadError instanceof Error ? loadError.message : tRef.current("products.loadError");
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
