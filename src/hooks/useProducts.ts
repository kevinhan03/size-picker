import { useEffect, useState } from "react";
import type { Product } from "../types";
import { searchProducts } from "../api";

export function useProducts() {
  const [productsError, setProductsError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const loaded = await searchProducts("");
        if (!isActive) return;
        setProducts(loaded);
        setProductsError(null);
      } catch (loadError: unknown) {
        if (!isActive) return;
        const message =
          loadError instanceof Error
            ? loadError.message
            : "상품 데이터를 불러오는 중 오류가 발생했습니다.";
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
    setProducts,
    setProductsError,
    setRetryTrigger,
  };
}
