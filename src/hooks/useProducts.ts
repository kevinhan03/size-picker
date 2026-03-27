import { useCallback, useEffect, useState } from 'react';
import { fetchAllProducts } from '../api';
import type { Product } from '../types';

export function useProducts() {
  const [productsError, setProductsError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const retryProductsLoad = useCallback(() => {
    setRetryTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const loaded = await fetchAllProducts();
        if (!isActive) return;
        setProducts(loaded);
        setProductsError(null);
      } catch (loadError: unknown) {
        if (!isActive) return;
        const message =
          loadError instanceof Error
            ? loadError.message
            : '상품 데이터를 불러오는 중 오류가 발생했습니다.';
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
    productsError,
    setProductsError,
    retryProductsLoad,
  };
}
